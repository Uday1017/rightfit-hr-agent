import { generate, generateWithWebSearch } from '../services/geminiService.js';
import Session from '../models/Session.js';
import { createTrace } from '../utils/langfuse.js';

export async function chat(req, res, next) {
  try {
    const { sessionId, message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message required' });

    console.log(`[Chat] "${message}" — session: ${sessionId}`);

    const trace = createTrace('chat', { sessionId, userId: req.user?.id, question: message });

    // Load session from DB
    let session = await Session.findOne({ sessionId });
    if (!session) {
      session = new Session({ sessionId, userId: req.user?.id, resumes: [], messages: [] });
    }

    const docs = session.resumes || [];
    const hasDocuments = docs.length > 0;

    // Classify question
    const classifyPrompt = `Reply with only one word — "docs", "web", or "both".
"docs" = answer is in uploaded resumes
"web" = needs current market or salary data
"both" = needs both
Question: "${message}"`;

    const classification = (await generate(classifyPrompt, trace, 'chat.classify')).trim().toLowerCase();
    console.log(`[Chat] Classification: ${classification}, docs: ${docs.length}`);

    let answer = '', sources = [], method = '';

    if (!hasDocuments || classification.includes('web')) {
      const result = await generateWithWebSearch(message, trace);
      answer = result.text;
      sources = result.sources;
      method = 'web_search';
    } else if (classification.includes('both')) {
      const context = docs.map(d => `=== ${d.filename} ===\n${d.text.slice(0, 1500)}`).join('\n\n');
      const [docAnswer, webResult] = await Promise.all([
        generate(`Answer from these resumes:\n${context}\n\nQuestion: ${message}`, trace, 'chat.rag'),
        generateWithWebSearch(message, trace)
      ]);
      answer = await generate(`Combine into one clear answer.\nFROM RESUMES: ${docAnswer}\nFROM WEB: ${webResult.text}\nQuestion: ${message}`, trace, 'chat.combine');
      sources = webResult.sources;
      method = 'combined';
    } else {
      const context = docs.map(d => `=== ${d.filename} ===\n${d.text.slice(0, 1500)}`).join('\n\n');
      answer = await generate(`You are an HR assistant. Answer based ONLY on these resumes:\n${context}\n\nQuestion: ${message}\n\nBe specific with names and details.`, trace, 'chat.rag');
      method = 'rag';
    }

    // Save both user message and assistant response to DB
    session.messages.push({ role: 'user', content: message });
    session.messages.push({ role: 'assistant', content: answer, sources, method });
    await session.save();

    console.log(`[Chat] Saved — session now has ${session.messages.length} messages`);

    res.json({ answer, sources, method });
  } catch (err) {
    console.error('[Chat] Error:', err.message);
    next(err);
  }
}

// Load chat history for a session
export async function getChatHistory(req, res, next) {
  try {
    const { sessionId } = req.params;
    const session = await Session.findOne({ sessionId });
    if (!session) return res.json({ messages: [] });
    res.json({ messages: session.messages });
  } catch (err) {
    next(err);
  }
}
