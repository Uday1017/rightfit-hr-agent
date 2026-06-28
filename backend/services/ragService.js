import { embedText, generate } from './geminiService.js';
import { searchChunks } from '../utils/vectorStore.js';

export async function answerFromDocs(sessionId, question) {
  const queryEmbedding = await embedText(question);
  const results = await searchChunks(sessionId, queryEmbedding, 5);

  if (!results.length || results[0].score < 0.4) {
    return { answer: null, foundInDocs: false, sources: [] };
  }

  const context = results
    .map((r, i) => `[Source ${i + 1} — ${r.docName} (${(r.score * 100).toFixed(0)}% match)]:\n${r.text}`)
    .join('\n\n');

  const prompt = `You are an expert HR assistant analyzing resumes and HR documents.

DOCUMENT CONTEXT:
${context}

QUESTION: ${question}

Answer based ONLY on the documents above. Be specific with names, skills, and details.
If comparing candidates, be objective and structured.`;

  const answer = await generate(prompt);
  return {
    answer,
    foundInDocs: true,
    sources: results.map(r => ({ doc: r.docName, relevance: Math.round(r.score * 100) }))
  };
}
