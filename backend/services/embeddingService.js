import { embedText } from './geminiService.js';
import { chunkText } from '../utils/chunker.js';
import { addChunk } from '../utils/vectorStore.js';
import { sleep } from '../utils/helpers.js';

export async function embedAndStoreDocument(sessionId, userId, docName, text, docType = 'resume') {
  const chunks = chunkText(text, 500, 50);
  console.log(`[Embed] ${chunks.length} chunks for ${docName} (${docType})`);
  for (const chunk of chunks) {
    const embedding = await embedText(chunk.text);
    await addChunk(sessionId, userId, docName, chunk, embedding, docType);
    await sleep(300);
  }
  console.log(`[Embed] Done — ${docName}`);
  return chunks.length;
}
