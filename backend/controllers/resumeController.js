import { generate } from '../services/geminiService.js';
import Session from '../models/Session.js';
import User from '../models/User.js';
import { v4 as uuidv4 } from 'uuid';
import { enqueueResume, resumeQueue } from '../queues/resumeQueue.js';

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
    const { sessionId, jobDescription } = req.body;
    const files = req.files;
    if (!files?.length) return res.status(400).json({ error: 'No files uploaded' });

    const sid = sessionId || uuidv4();

    // Ensure session exists in DB
    let session = await Session.findOne({ sessionId: sid });
    if (!session) {
      const title = jobDescription?.trim().slice(0, 60) || 'Untitled Session';
      session = await Session.create({ sessionId: sid, userId: req.user?.id, title, jobDescription, resumes: [], messages: [] });
    }

    // Enqueue each file as a separate job
    const user = await User.findById(req.user?.id).select('geminiApiKey');
    const jobs = await Promise.all(files.map(file =>
      enqueueResume({
        filePath: file.path,
        originalName: file.originalname,
        sessionId: sid,
        userId: req.user?.id,
        jobDescription,
        geminiApiKey: user?.geminiApiKey || null,
      })
    ));

    console.log(`[Queue] Enqueued ${jobs.length} jobs for session ${sid}`);
    res.json({ sessionId: sid, jobIds: jobs, total: jobs.length });
  } catch (err) {
    console.error('[Resume] Error:', err.message);
    next(err);
  }
}

export async function getJobStatus(req, res, next) {
  try {
    const { jobId } = req.params;
    const job = await resumeQueue.getJob(jobId);
    if (!job) return res.status(404).json({ error: 'Job not found' });

    const state = await job.getState();
    const progress = job.progress || 0;
    const result = state === 'completed' ? job.returnvalue : null;
    const failReason = state === 'failed' ? job.failedReason : null;

    res.json({ jobId, state, progress, filename: job.data.originalName, result, failReason });
  } catch (err) {
    next(err);
  }
}

export async function renameSession(req, res, next) {
  try {
    const { sessionId } = req.params;
    const { title } = req.body;
    if (!title?.trim()) return res.status(400).json({ error: 'Title required' });
    await Session.updateOne({ sessionId, userId: req.user.id }, { title: title.trim() });
    res.json({ success: true });
  } catch (err) { next(err); }
}

export async function deleteResume(req, res, next) {
  try {
    const { sessionId, resumeId } = req.params;
    const session = await Session.findOne({ sessionId, userId: req.user.id });
    if (!session) return res.status(404).json({ error: 'Session not found' });
    session.resumes = session.resumes.filter(r => r.id !== resumeId);
    await session.save();
    res.json({ success: true });
  } catch (err) { next(err); }
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

export async function compareCandidate(req, res, next) {
  try {
    const { candidates, jobDescription } = req.body;
    if (!candidates?.length || candidates.length < 2) {
      return res.status(400).json({ error: 'Select 2-3 candidates to compare' });
    }
    if (candidates.length > 3) {
      return res.status(400).json({ error: 'Maximum 3 candidates can be compared' });
    }

    const candidateDetails = candidates.map((c, i) => `
CANDIDATE ${i + 1}: ${c.name}
Score: ${c.score}/100
Recommendation: ${c.recommendation}
Summary: ${c.summary}
Years of Experience: ${c.yearsOfExperience}
Top Skills: ${c.topSkills?.join(', ')}
Strengths: ${c.strengths?.join(', ')}
Gaps: ${c.gaps?.join(', ')}
`).join('\n---\n');

    const prompt = `You are an expert HR analyst. Compare these ${candidates.length} candidates side-by-side for the following role:

JOB DESCRIPTION:
${jobDescription || 'Not specified'}

${candidateDetails}

Generate a detailed comparison table in JSON format with the following structure:
{
  "comparison": [
    {
      "category": "Experience",
      "candidate1": "...",
      "candidate2": "...",
      ${candidates.length > 2 ? '"candidate3": "..."' : ''}
    },
    ... (include 6-8 meaningful comparison categories like Skills Match, Growth Potential, Immediate Availability, Technical Depth, Communication, etc.)
  ],
  "summary": "A 2-3 sentence overall comparison summary"
}

Make the comparison insightful, specific to each candidate, and focus on what matters for the role.
Return ONLY valid JSON, no markdown.`;

    const raw = await generate(prompt);
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const comparison = JSON.parse(cleaned);

    res.json({
      comparison,
      candidates: candidates.map(c => ({ name: c.name, score: c.score }))
    });
  } catch (err) {
    console.error('[Compare] Error:', err.message);
    next(err);
  }
}
