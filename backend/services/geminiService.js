import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

function getClient(apiKey) {
  return apiKey ? new GoogleGenerativeAI(apiKey) : genAI;
}

export const getModel = (apiKey) => getClient(apiKey).getGenerativeModel({ model: 'gemini-2.5-flash' });
export const getEmbeddingModel = (apiKey) => getClient(apiKey).getGenerativeModel({ model: 'gemini-embedding-001' });

async function withRetry(fn, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      const is503 = err.message?.includes('503') || err.message?.includes('UNAVAILABLE');
      const is429 = err.message?.includes('429') || err.message?.includes('RESOURCE_EXHAUSTED');
      if ((is503 || is429) && i < retries - 1) {
        const wait = (i + 1) * 8000;
        console.log(`[Gemini] ${is503 ? '503' : '429'} — retrying in ${wait/1000}s... (attempt ${i+1}/${retries})`);
        await new Promise(r => setTimeout(r, wait));
      } else throw err;
    }
  }
}

export async function generate(prompt, trace = null, spanName = 'gemini.generate', apiKey = null) {
  return withRetry(async () => {
    const model = getModel(apiKey);
    const generation = trace?.generation({
      name: spanName,
      model: 'gemini-2.5-flash',
      input: prompt,
    });
    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const usage = result.response.usageMetadata;
      generation?.end({
        output: text,
        usage: {
          input: usage?.promptTokenCount,
          output: usage?.candidatesTokenCount,
          total: usage?.totalTokenCount,
        },
      });
      return text;
    } catch (err) {
      generation?.end({ level: 'ERROR', statusMessage: err.message });
      throw err;
    }
  });
}

export async function generateWithWebSearch(prompt, trace = null, apiKey = null) {
  return withRetry(async () => {
    const model = getClient(apiKey).getGenerativeModel({
      model: 'gemini-2.5-flash',
      tools: [{ googleSearch: {} }],
    });
    const generation = trace?.generation({
      name: 'gemini.webSearch',
      model: 'gemini-2.5-flash',
      input: prompt,
    });
    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const usage = result.response.usageMetadata;
      const sources = [];
      try {
        const metadata = result.response.candidates?.[0]?.groundingMetadata;
        if (metadata?.groundingChunks) {
          for (const chunk of metadata.groundingChunks) {
            if (chunk.web) sources.push({ title: chunk.web.title, url: chunk.web.uri });
          }
        }
      } catch {}
      generation?.end({
        output: text,
        usage: { input: usage?.promptTokenCount, output: usage?.candidatesTokenCount, total: usage?.totalTokenCount },
        metadata: { sources: sources.length },
      });
      return { text, sources };
    } catch (err) {
      generation?.end({ level: 'ERROR', statusMessage: err.message });
      throw err;
    }
  });
}

export async function embedText(text, trace = null, apiKey = null) {
  return withRetry(async () => {
    const model = getEmbeddingModel(apiKey);
    const span = trace?.span({ name: 'gemini.embed', input: text.slice(0, 200) });
    try {
      const result = await model.embedContent(text);
      const values = result.embedding.values;
      span?.end({ output: `${values.length}d vector` });
      return values;
    } catch (err) {
      span?.end({ level: 'ERROR', statusMessage: err.message });
      throw err;
    }
  });
}
