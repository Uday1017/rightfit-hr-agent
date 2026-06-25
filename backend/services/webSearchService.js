import { generateWithWebSearch } from './geminiService.js';

export async function searchWeb(question, context = '') {
  const prompt = context
    ? `HR context: ${context}\n\nSearch the web to answer: ${question}\nFocus on HR and recruitment. Cite sources.`
    : `Search the web to answer this HR question: ${question}\nProvide current, accurate information with sources.`;
  return await generateWithWebSearch(prompt);
}
