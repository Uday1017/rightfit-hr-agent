import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { extractTextFromPDF, extractTextFromTxt } from '../services/ocrService.js';
import { generateStructured } from '../services/geminiService.js';
import { cleanText } from '../utils/helpers.js';
import Session from '../models/Session.js';
import { hashResumeText, getCachedScreening, setCachedScreening } from '../utils/resumeHashCache.js';

// Gemini responseSchema — enforces structured output without regex cleaning
const screeningSchema = {
  type: 'object',
  properties: {
    name:              { type: 'string' },
    score:             { type: 'integer', minimum: 0, maximum: 100 },
    summary:           { type: 'string' },
    strengths:         { type: 'array', items: { type: 'string' } },
    gaps:              { type: 'array', items: { type: 'string' } },
    recommendation:    { type: 'string', enum: ['Strong hire', 'Good candidate', 'Not a fit', 'Review manually'] },
    yearsOfExperience: { type: 'integer' },
    topSkills:         { type: 'array', items: { type: 'string' } },
  },
  required: ['name', 'score', 'summary', 'strengths', 'gaps', 'recommendation', 'yearsOfExperience', 'topSkills'],
};

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

  // Compute SHA256 of the cleaned text — identical content = same hash
  const contentHash = hashResumeText(text);
  console.log(`[Worker] Content hash: ${contentHash.slice(0, 12)}… (${originalName})`);

  // Check cache before hitting the AI pipeline
  const cachedScreening = await getCachedScreening(contentHash, jobDescription);
  if (cachedScreening) {
    console.log(`[Worker] DEDUP HIT — reusing cached screening for ${originalName}`);
    await job.updateProgress(80);

    let session = await Session.findOne({ sessionId });
    if (!session) {
      session = new Session({ sessionId, userId, jobDescription, resumes: [], messages: [] });
    }
    const resumeDoc = { id: uuidv4(), filename: originalName, text, contentHash, screening: cachedScreening };
    const existingIndex = session.resumes.findIndex(r => r.filename === originalName);
    if (existingIndex >= 0) {
      session.resumes[existingIndex] = resumeDoc;
    } else {
      session.resumes.push(resumeDoc);
    }
    await session.save();
    try { fs.unlinkSync(filePath); } catch {}
    await job.updateProgress(100);
    console.log(`[Worker] Done (cached): ${originalName}`);
    return { id: resumeDoc.id, filename: originalName, screening: cachedScreening };
  }

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

Evaluate the candidate and return a structured screening result.`;

    screening = await generateStructured(prompt, screeningSchema, geminiApiKey);
    console.log(`[Worker] Screened: ${screening.name} — ${screening.score}/100`);
    await setCachedScreening(contentHash, jobDescription, screening);
  }

  await job.updateProgress(80);

  let session = await Session.findOne({ sessionId });
  if (!session) {
    session = new Session({ sessionId, userId, jobDescription, resumes: [], messages: [] });
  }

  const resumeDoc = { id: uuidv4(), filename: originalName, text, contentHash, screening };
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
