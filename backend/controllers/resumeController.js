import { extractTextFromPDF, extractTextFromTxt } from '../services/ocrService.js';
import { generate } from '../services/geminiService.js';
import { cleanText } from '../utils/helpers.js';
import Session from '../models/Session.js';
import { embedAndStoreDocument } from '../services/embeddingService.js';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

export async function getUserSessions(req, res, next) {
  try {
    const sessions = await Session.find({ userId: req.user.id }, 'sessionId title jobDescription createdAt').sort({ createdAt: -1 });
    res.json({ sessions });
  } catch (err) { next(err); }
}

export async function createSession(req, res, next) {
  try {
    const { title } = req.body;
    const sessionId = uuidv4();
    const session = await Session.create({ sessionId, userId: req.user.id, title: title || 'Untitled Session', resumes: [], messages: [] });
    res.json({ sessionId: session.sessionId, title: session.title });
  } catch (err) { next(err); }
}

export async function getSessionResumes(req, res, next) {
  try {
    const session = await Session.findOne({ sessionId: req.params.sessionId, userId: req.user.id });
    if (!session) return res.json({ resumes: [], jobDescription: '' });
    res.json({
      resumes: session.resumes.map(r => ({ id: r.id, filename: r.filename, screening: r.screening })),
      jobDescription: session.jobDescription || ''
    });
  } catch (err) { next(err); }
}

export async function uploadResumes(req, res, next) {
  try {
    console.log('[Resume] Request received');
    const { sessionId, jobDescription } = req.body;
    const files = req.files;

    if (!files?.length) return res.status(400).json({ error: 'No files uploaded' });

    const sid = sessionId || uuidv4();

    // Load or create session from DB
    let session = await Session.findOne({ sessionId: sid });
    if (!session) {
      const title = jobDescription?.trim().slice(0, 60) || 'Untitled Session';
      session = new Session({ sessionId: sid, userId: req.user?.id, title, jobDescription, resumes: [] });
    }

    const results = [];

    for (const file of files) {
      console.log(`[Resume] Processing: ${file.originalname}`);
      const ext = path.extname(file.originalname).toLowerCase();

      let rawText = '';
      if (ext === '.pdf') rawText = await extractTextFromPDF(file.path);
      else if (ext === '.txt') rawText = extractTextFromTxt(file.path);

      const text = cleanText(rawText);
      console.log(`[Resume] Extracted ${text.length} chars`);

      let screening = {
        name: file.originalname,
        score: 0,
        summary: 'No job description provided',
        strengths: [],
        gaps: [],
        recommendation: 'Review manually',
        yearsOfExperience: 0,
        topSkills: []
      };

      if (jobDescription?.trim()) {
        console.log('[Resume] Running screening...');
        const prompt = `You are an expert HR recruiter. Analyze this resume against the job description.

JOB DESCRIPTION:
${jobDescription}

RESUME:
${text.slice(0, 3000)}

Return ONLY a valid JSON object, no markdown, no explanation:
{
  "name": "candidate full name or Unknown",
  "score": 75,
  "summary": "2 sentence summary of the candidate",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "gaps": ["gap 1", "gap 2"],
  "recommendation": "Strong hire",
  "yearsOfExperience": 3,
  "topSkills": ["skill1", "skill2", "skill3"]
}`;

        try {
          const raw = await generate(prompt);
          const cleaned = raw.replace(/```json|```/g, '').trim();
          screening = JSON.parse(cleaned);
          console.log('[Resume] Done:', screening.name, 'Score:', screening.score);
        } catch (e) {
          console.error('[Resume] Parse error:', e.message);
        }
      }

      try { fs.unlinkSync(file.path); } catch {}

      const resumeDoc = { id: uuidv4(), filename: file.originalname, text, screening };

      // Check if resume already exists in session, update it
      const existingIndex = session.resumes.findIndex(r => r.filename === file.originalname);
      if (existingIndex >= 0) {
        session.resumes[existingIndex] = resumeDoc;
      } else {
        session.resumes.push(resumeDoc);
      }

      results.push({ id: resumeDoc.id, filename: file.originalname, screening });
    }

    await session.save();
    console.log(`[Resume] Session saved — ${session.resumes.length} total resumes`);

    // Return ALL resumes in session, not just the new ones
    const allResumes = session.resumes.map(r => ({
      id: r.id,
      filename: r.filename,
      screening: r.screening
    }));

    res.json({ sessionId: sid, resumes: allResumes });

  } catch (err) {
    console.error('[Resume] Error:', err.message);
    next(err);
  }
}

export async function rankCandidates(req, res, next) {
  try {
    const { candidates, jobDescription } = req.body;
    if (!candidates?.length) return res.status(400).json({ error: 'No candidates' });

    const prompt = `Rank these candidates best to worst for this role.

JOB DESCRIPTION: ${jobDescription}

CANDIDATES:
${candidates.map((c, i) => `${i + 1}. ${c.name} — Score: ${c.score}/100\nStrengths: ${c.strengths?.join(', ')}\nGaps: ${c.gaps?.join(', ')}`).join('\n\n')}

Return ONLY a JSON array, no markdown:
[{ "name": "...", "rank": 1, "reason": "one sentence why" }]`;

    const raw = await generate(prompt);
    const cleaned = raw.replace(/```json|```/g, '').trim();
    res.json({ ranking: JSON.parse(cleaned) });
  } catch (err) {
    next(err);
  }
}
