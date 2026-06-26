import fs from 'fs';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { createRequire } from 'module';

dotenv.config();

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function extractTextFromPDF(filePath) {
  const buffer = fs.readFileSync(filePath);

  try {
    const data = await pdfParse(buffer);
    const text = data.text.trim();
    if (text.length > 100) {
      console.log(`[OCR] Text extracted: ${text.length} chars`);
      return text;
    }
  } catch (e) {
    console.log('[OCR] pdf-parse failed:', e.message);
  }

  return await extractWithGeminiVision(buffer);
}

async function extractWithGeminiVision(buffer) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  const result = await model.generateContent([
    { inlineData: { data: buffer.toString('base64'), mimeType: 'application/pdf' } },
    'Extract ALL text from this resume. Include name, contact, skills, experience, education. Output only the extracted text.'
  ]);
  const text = result.response.text();
  console.log(`[OCR] Gemini Vision: ${text.length} chars`);
  return text;
}

export function extractTextFromTxt(filePath) {
  return fs.readFileSync(filePath, 'utf-8');
}
