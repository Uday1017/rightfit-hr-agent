import { answerFromDocs } from '../services/ragService.js';
import { searchWeb } from '../services/webSearchService.js';
import { generate } from '../services/geminiService.js';

export async function chat(req, res, next) {
  try {
    const { sessionId, message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message required' });

    const classifyPrompt = `Classify this HR question. Reply with only one word: "docs", "web", or "both".
"docs" = answer in uploaded resumes or HR documents
"web" = needs current data like salary benchmarks or market trends
"both" = needs both
Question: "${message}"`;

    const classification = (await generate(classifyPrompt)).trim().toLowerCase();
    console.log(`[Chat] ${classification} — ${message}`);

    let answer = '', sources = [], method = '';

    if (classification.includes('web')) {
      const result = await searchWeb(message);
      answer = result.text;
      sources = result.sources;
      method = 'web_search';
    } else if (classification.includes('both')) {
      const [ragResult, webResult] = await Promise.all([
        answerFromDocs(sessionId, message),
        searchWeb(message)
      ]);
      const combinePrompt = `Combine into one clear answer.
FROM DOCUMENTS: ${ragResult.answer || 'Not found'}
FROM WEB: ${webResult.text}
Question: ${message}`;
      answer = await generate(combinePrompt);
      sources = [...(ragResult.sources || []), ...(webResult.sources || [])];
      method = 'combined';
    } else {
      const ragResult = await answerFromDocs(sessionId, message);
      if (ragResult.foundInDocs) {
        answer = ragResult.answer;
        sources = ragResult.sources;
        method = 'rag';
      } else {
        const webResult = await searchWeb(message);
        answer = webResult.text;
        sources = webResult.sources;
        method = 'web_fallback';
      }
    }

    res.json({ answer, sources, method });
  } catch (err) {
    next(err);
  }
}
