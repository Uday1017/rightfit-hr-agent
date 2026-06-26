import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const getModel = () => genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
export const getEmbeddingModel = () => genAI.getGenerativeModel({ model: 'gemini-embedding-001' });

// Retry wrapper — waits and retries on 503
async function withRetry(fn, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      const is503 = err.message?.includes('503') || err.message?.includes('UNAVAILABLE');
      const is429 = err.message?.includes('429') || err.message?.includes('RESOURCE_EXHAUSTED');
      if ((is503 || is429) && i < retries - 1) {
        const wait = (i + 1) * 8000; // 8s, 16s, 24s
        console.log(`[Gemini] ${is503 ? '503' : '429'} — retrying in ${wait/1000}s... (attempt ${i+1}/${retries})`);
        await new Promise(r => setTimeout(r, wait));
      } else {
        throw err;
      }
    }
  }
}

export async function generate(prompt) {
  return withRetry(async () => {
    const model = getModel();
    const result = await model.generateContent(prompt);
    return result.response.text();
  });
}

export async function generateWithWebSearch(prompt) {
  return withRetry(async () => {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      tools: [{ googleSearch: {} }]
    });
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const sources = [];
    try {
      const metadata = result.response.candidates?.[0]?.groundingMetadata;
      if (metadata?.groundingChunks) {
        for (const chunk of metadata.groundingChunks) {
          if (chunk.web) sources.push({ title: chunk.web.title, url: chunk.web.uri });
        }
      }
    } catch {}
    return { text, sources };
  });
}

export async function embedText(text) {
  return withRetry(async () => {
    const model = getEmbeddingModel();
    const result = await model.embedContent(text);
    return result.embedding.values;
  });
}
