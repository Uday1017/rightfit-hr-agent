import { GoogleGenerativeAI } from '@google/generative-ai';
import Session from '../models/Session.js';
import { createTrace } from '../utils/langfuse.js';
import { embedText } from '../services/geminiService.js';
import { searchChunks } from '../utils/vectorStore.js';
import { generateWithWebSearch } from '../services/geminiService.js';
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Tool definitions — Gemini decides which to call and when
const tools = [{
  functionDeclarations: [
    {
      name: 'search_resumes',
      description: 'Searches uploaded candidate resumes for relevant information using semantic search. Use when the question is about candidates, their skills, experience, education, or comparing them.',
      parameters: {
        type: 'OBJECT',
        properties: {
          query: { type: 'STRING', description: 'The search query to find relevant resume content' }
        },
        required: ['query']
      }
    },
    {
      name: 'search_web',
      description: 'Searches the live web for current information. Use when the question needs salary benchmarks, market trends, company info, interview tips, or anything not found in resumes.',
      parameters: {
        type: 'OBJECT',
        properties: {
          query: { type: 'STRING', description: 'The web search query' }
        },
        required: ['query']
      }
    },
    {
      name: 'get_all_candidates',
      description: 'Returns a summary of all candidates in the current hiring session. Use when the user asks to list, compare, or rank all candidates.',
      parameters: {
        type: 'OBJECT',
        properties: {}
      }
    }
  ]
}];

// Tool executors
async function executeTool(name, args, sessionDocs, sessionId, trace) {
  const span = trace?.span({ name: `tool.${name}`, input: args });

  try {
    if (name === 'search_resumes') {
      const embedding = await embedText(args.query);
      const results = await searchChunks(sessionId, embedding, 5);
      if (!results.length || results[0].score < 0.35) {
        const fallback = sessionDocs.map(d =>
          `=== ${d.filename} ===\n${d.text.slice(0, 800)}`
        ).join('\n\n') || 'No resume data found.';
        span?.end({ output: 'fallback to raw text' });
        return fallback;
      }
      const output = results.map((r, i) =>
        `[${i + 1}] ${r.docName} (${(r.score * 100).toFixed(0)}% match):\n${r.text}`
      ).join('\n\n');
      span?.end({ output: `${results.length} chunks found` });
      return output;
    }

    if (name === 'search_web') {
      const result = await generateWithWebSearch(args.query);
      span?.end({ output: result.text.slice(0, 200), metadata: { sources: result.sources.length } });
      return result.text + (result.sources.length
        ? '\n\nSources: ' + result.sources.map(s => s.url).join(', ')
        : '');
    }

    if (name === 'get_all_candidates') {
      if (!sessionDocs.length) return 'No candidates uploaded in this session.';
      const output = sessionDocs.map((d, i) => {
        const s = d.screening;
        return `${i + 1}. ${s?.name || d.filename} — Score: ${s?.score ?? 'N/A'}/100 — ${s?.recommendation || ''}\n   Skills: ${s?.topSkills?.join(', ') || 'N/A'}\n   Experience: ${s?.yearsOfExperience ?? '?'} years`;
      }).join('\n\n');
      span?.end({ output: `${sessionDocs.length} candidates` });
      return output;
    }
  } catch (err) {
    span?.end({ level: 'ERROR', statusMessage: err.message });
    throw err;
  }
}

export async function chat(req, res, next) {
  try {
    const { sessionId, message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message required' });

    console.log(`[Agent] "${message}" — session: ${sessionId}`);

    const trace = createTrace('chat.agent', { sessionId, userId: req.user?.id, question: message });

    let session = await Session.findOne({ sessionId });
    if (!session) {
      session = new Session({ sessionId, userId: req.user?.id, resumes: [], messages: [] });
    }

    const sessionDocs = session.resumes || [];

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      tools,
      toolConfig: { functionCallingConfig: { mode: 'AUTO' } },
      systemInstruction: `You are RightFit, an expert HR assistant. You have access to tools to search candidate resumes and the web.
You MUST use tools to answer questions — never answer from memory alone.
- Use search_resumes when the question involves candidates, skills, scores, or experience
- Use search_web when the question needs salary data, market trends, or live information
- Use get_all_candidates when asked to list or compare all candidates
- For complex questions, call ALL required tools before writing your final answer. Never say "I will search" — just call the tool immediately.
- If a question has multiple parts (e.g. candidate fit AND market salary), call search_resumes AND search_web before answering.
Always base your answer on what the tools return.`
    });

    // Build conversation history for context
    const history = session.messages.slice(-6).map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const chatSession = model.startChat({ history });

    // Agentic loop — max 5 iterations to prevent infinite loops
    const allSources = [];
    let response = await chatSession.sendMessage(message);
    let iterations = 0;

    while (iterations < 8) {
      const candidate = response.response.candidates?.[0];
      const parts = candidate?.content?.parts || [];
      const toolCallPart = parts.find(p => p.functionCall);

      if (!toolCallPart) break; // Gemini returned text — done

      const { name, args } = toolCallPart.functionCall;
      console.log(`[Agent] Tool call: ${name}`, args);

      const toolResult = await executeTool(name, args, sessionDocs, sessionId, trace);

      // If web search, collect sources
      if (name === 'search_web' && toolResult.includes('Sources:')) {
        const srcLine = toolResult.split('Sources:')[1]?.trim();
        if (srcLine) allSources.push(...srcLine.split(', ').map(url => ({ url, title: url })));
      }

      // Feed tool result back to Gemini
      response = await chatSession.sendMessage([{
        functionResponse: { name, response: { result: toolResult } }
      }]);

      iterations++;
    }

    const answer = response.response.text();
    const method = iterations > 0 ? 'agent' : 'direct';

    trace?.update({ output: answer.slice(0, 300), metadata: { iterations, method } });

    session.messages.push({ role: 'user', content: message });
    session.messages.push({ role: 'assistant', content: answer, sources: allSources, method });
    await session.save();

    console.log(`[Agent] Done — ${iterations} tool calls, method: ${method}`);
    res.json({ answer, sources: allSources, method });

  } catch (err) {
    console.error('[Agent] Error:', err.message);
    next(err);
  }
}

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
