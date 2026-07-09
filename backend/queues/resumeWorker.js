import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { extractTextFromPDF, extractTextFromTxt } from '../services/ocrService.js';
import { generate } from '../services/geminiService.js';
import { cleanText } from '../utils/helpers.js';
import Session from '../models/Session.js';

const connection = new IORedis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
});

export const worker = new Worker('resume-processing', async (job) => {
  const { filePath, originalName, sessionId, userId, jobDescription, geminiApiKey } = job.data;

  console.log(`[Worker] Processing: ${originalName} (job ${job.id})`);
  await job.updateProgress(10);

  const ext = path.extname(originalName).toLowerCase();
  const rawText = ext === '.pdf'
    ? await extractTextFromPDF(filePath)
    : extractTextFromTxt(filePath);

  const text = cleanText(rawText);
  await job.updateProgress(40);

  let screening = {
    name: originalName,
    score: 0,
    summary: 'No job description provided',
    strengths: [],
    gaps: [],
    recommendation: 'Review manually',
    yearsOfExperience: 0,
    topSkills: [],
  };

  if (jobDescription?.trim()) {
    const prompt = `You are an expert HR recruiter. Analyze this resume against the job description.

JOB DESCRIPTION:
${jobDescription}

RESUME:
${text.slice(0, 3000)}

Return ONLY a valid JSON object, no markdown:
{
  "name": "candidate full name",
  "score": 75,
  "summary": "2 sentence summary",
  "strengths": ["strength 1", "strength 2"],
  "gaps": ["gap 1", "gap 2"],
  "recommendation": "Strong hire",
  "yearsOfExperience": 3,
  "topSkills": ["skill1", "skill2", "skill3"]
}`;

    const raw = await generate(prompt, null, 'screening', geminiApiKey);
    screening = JSON.parse(raw.replace(/```json|```/g, '').trim());
    console.log(`[Worker] Screened: ${screening.name} — ${screening.score}/100`);
  }

  await job.updateProgress(80);

  let session = await Session.findOne({ sessionId });
  if (!session) {
    session = new Session({ sessionId, userId, jobDescription, resumes: [], messages: [] });
  }

  const resumeDoc = { id: uuidv4(), filename: originalName, text, screening };
  const existingIndex = session.resumes.findIndex(r => r.filename === originalName);
  if (existingIndex >= 0) {
    session.resumes[existingIndex] = resumeDoc;
  } else {
    session.resumes.push(resumeDoc);
  }

  await session.save();
  try { fs.unlinkSync(filePath); } catch {}

  await job.updateProgress(100);
  console.log(`[Worker] Done: ${originalName}`);

  return { id: resumeDoc.id, filename: originalName, screening };
}, {
  connection,
  concurrency: 2,
});

worker.on('failed', (job, err) => {
  console.error(`[Worker] Job ${job.id} failed: ${err.message}`);
});
