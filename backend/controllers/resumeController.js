import { extractTextFromPDF, extractTextFromTxt } from '../services/ocrService.js';
import { embedAndStoreDocument } from '../services/embeddingService.js';
import { generate } from '../services/geminiService.js';
import { cleanText } from '../utils/helpers.js';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

export async function uploadResumes(req, res, next) {
  try {
    const { sessionId, jobDescription } = req.body;
    const files = req.files;
    if (!files?.length) return res.status(400).json({ error: 'No files uploaded' });

    const sid = sessionId || uuidv4();
    const results = [];

    for (const file of files) {
      const ext = path.extname(file.originalname).toLowerCase();
      let rawText = ext === '.pdf'
        ? await extractTextFromPDF(file.path)
        : extractTextFromTxt(file.path);

      const text = cleanText(rawText);
      const chunks = await embedAndStoreDocument(sid, file.originalname, text);

      let screening = null;
      if (jobDescription) {
        const prompt = `You are an expert HR recruiter. Analyze this resume against the job description.

JOB DESCRIPTION:
${jobDescription}

RESUME:
${text.slice(0, 3000)}

Return ONLY a JSON object with these exact fields:
{
  "name": "candidate full name",
  "score": 85,
  "summary": "2 sentence summary",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "gaps": ["gap 1", "gap 2"],
  "recommendation": "Strong hire / Good candidate / Not a fit",
  "yearsOfExperience": 4,
  "topSkills": ["skill1", "skill2", "skill3"]
}`;

        try {
          const raw = await generate(prompt);
          const cleaned = raw.replace(/```json|```/g, '').trim();
          screening = JSON.parse(cleaned);
        } catch {
          screening = {
            name: file.originalname,
            score: 0,
            summary: 'Could not parse resume',
            strengths: [],
            gaps: [],
            recommendation: 'Review manually',
            yearsOfExperience: 0,
            topSkills: []
          };
        }
      }

      try { fs.unlinkSync(file.path); } catch {}

      results.push({
        id: uuidv4(),
        filename: file.originalname,
        chunks,
        screening
      });
    }

    res.json({ sessionId: sid, resumes: results });
  } catch (err) {
    next(err);
  }
}

export async function rankCandidates(req, res, next) {
  try {
    const { candidates, jobDescription } = req.body;
    if (!candidates?.length) return res.status(400).json({ error: 'No candidates provided' });

    const prompt = `Rank these candidates for the role from best to worst fit.

JOB DESCRIPTION: ${jobDescription}

CANDIDATES:
${candidates.map((c, i) => `${i + 1}. ${c.name} — Score: ${c.score}/100\nStrengths: ${c.strengths?.join(', ')}\nGaps: ${c.gaps?.join(', ')}`).join('\n\n')}

Return ONLY a JSON array:
[{ "name": "...", "rank": 1, "reason": "one sentence why" }]`;

    const raw = await generate(prompt);
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const ranking = JSON.parse(cleaned);
    res.json({ ranking });
  } catch (err) {
    next(err);
  }
}
