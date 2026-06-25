import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const getModel = () => genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

export const getEmbeddingModel = () => genAI.getGenerativeModel({ model: 'text-embedding-004' });

export async function generate(prompt) {
  const model = getModel();
  const result = await model.generateContent(prompt);
  return result.response.text();
}

export async function generateWithWebSearch(prompt) {
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
}

export async function embedText(text) {
  const model = getEmbeddingModel();
  const result = await model.embedContent(text);
  return result.embedding.values;
}
