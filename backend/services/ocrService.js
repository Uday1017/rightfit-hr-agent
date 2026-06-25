import fs from 'fs';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function extractTextFromPDF(filePath) {
  const buffer = fs.readFileSync(filePath);

  try {
    const { default: pdfParse } = await import('pdf-parse');
    const data = await pdfParse(buffer);
    const text = data.text.trim();
    if (text.length > 100) {
      console.log(`[OCR] Text extracted: ${text.length} chars`);
      return text;
    }
  } catch {
    console.log('[OCR] pdf-parse failed, using Gemini Vision...');
  }

  return await extractWithGeminiVision(buffer);
}

async function extractWithGeminiVision(buffer) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  const result = await model.generateContent([
    {
      inlineData: {
        data: buffer.toString('base64'),
        mimeType: 'application/pdf'
      }
    },
    `Extract ALL text from this resume exactly as it appears.
Include name, contact, skills, experience, education, achievements.
Preserve structure. Output only the extracted text.`
  ]);
  const text = result.response.text();
  console.log(`[OCR] Gemini Vision: ${text.length} chars`);
  return text;
}

export function extractTextFromTxt(filePath) {
  return fs.readFileSync(filePath, 'utf-8');
}
