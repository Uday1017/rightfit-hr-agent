import { embedText } from './geminiService.js';
import { chunkText } from '../utils/chunker.js';
import { addChunk } from '../utils/vectorStore.js';
import { sleep } from '../utils/helpers.js';

export async function embedAndStoreDocument(sessionId, docName, text) {
  const chunks = chunkText(text, 500, 50);
  console.log(`[Embed] ${chunks.length} chunks for ${docName}`);
  for (const chunk of chunks) {
    const embedding = await embedText(chunk.text);
    addChunk(sessionId, docName, chunk, embedding);
    await sleep(300);
  }
  console.log(`[Embed] Done — ${docName}`);
  return chunks.length;
}
