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

/**
 * Validate that a parsed screening result has the expected shape.
 * Returns an array of error strings (empty = valid).
 */
function validateScreening(obj) {
  const errors = [];
  if (typeof obj.name !== 'string') errors.push('name must be string');
  if (typeof obj.score !== 'number' || obj.score < 0 || obj.score > 100) errors.push('score must be integer 0-100');
  if (typeof obj.summary !== 'string') errors.push('summary must be string');
  if (!Array.isArray(obj.strengths)) errors.push('strengths must be array');
  if (!Array.isArray(obj.gaps)) errors.push('gaps must be array');
  if (!Array.isArray(obj.topSkills)) errors.push('topSkills must be array');
  if (typeof obj.yearsOfExperience !== 'number') errors.push('yearsOfExperience must be integer');
  const validRecs = ['Strong hire', 'Good candidate', 'Not a fit', 'Review manually'];
  if (!validRecs.includes(obj.recommendation)) errors.push(`recommendation must be one of: ${validRecs.join(', ')}`);
  return errors;
}

/**
 * Call Gemini with structured JSON output enforced via responseMimeType + responseSchema.
 * Includes a separate schema-validation retry loop (up to 2 retries) distinct from
 * the 503/429 retry logic in withRetry().
 *
 * @param {string} prompt
 * @param {object} schema  - Gemini responseSchema object
 * @param {string|null} apiKey
 * @returns {Promise<object>} Parsed, validated JSON object
 */
export async function generateStructured(prompt, schema, apiKey = null, trace = null) {
  const MAX_VALIDATION_RETRIES = 2;

  for (let attempt = 0; attempt <= MAX_VALIDATION_RETRIES; attempt++) {
    const result = await withRetry(async () => {
      const client = getClient(apiKey);
      const model = client.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: schema,
        },
      });

      const generation = trace?.generation({
        name: 'gemini.structured',
        model: 'gemini-2.5-flash',
        input: prompt,
        metadata: { attempt: attempt + 1 },
      });

      try {
        const response = await model.generateContent(prompt);
        const parsed = JSON.parse(response.response.text());
        const usage = response.response.usageMetadata;
        generation?.end({
          output: parsed,
          usage: {
            input: usage?.promptTokenCount,
            output: usage?.candidatesTokenCount,
            total: usage?.totalTokenCount,
          },
        });
        return parsed;
      } catch (err) {
        generation?.end({ level: 'ERROR', statusMessage: err.message });
        throw err;
      }
    });

    const errors = validateScreening(result);
    if (errors.length === 0) return result;

    console.warn(`[Gemini] Structured output validation failed (attempt ${attempt + 1}): ${errors.join('; ')}`);
    if (attempt === MAX_VALIDATION_RETRIES) {
      throw new Error(`Structured output failed validation after ${MAX_VALIDATION_RETRIES + 1} attempts: ${errors.join('; ')}`);
    }
    // Loop to retry — Gemini re-generates against the schema
  }
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
