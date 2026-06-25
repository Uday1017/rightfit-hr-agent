import fs from 'fs';
import path from 'path';

const STORE_PATH = './data/vectorstore.json';

function ensureDir() {
  const dir = path.dirname(STORE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function loadStore() {
  ensureDir();
  if (!fs.existsSync(STORE_PATH)) return {};
  try { return JSON.parse(fs.readFileSync(STORE_PATH, 'utf-8')); }
  catch { return {}; }
}

function saveStore(store) {
  ensureDir();
  fs.writeFileSync(STORE_PATH, JSON.stringify(store), 'utf-8');
}

function cosineSimilarity(a, b) {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  return dot / (Math.sqrt(magA) * Math.sqrt(magB) + 1e-8);
}

export function addChunk(sessionId, docName, chunk, embedding) {
  const store = loadStore();
  if (!store[sessionId]) store[sessionId] = [];
  store[sessionId].push({ docName, text: chunk.text, chunkId: chunk.id, embedding });
  saveStore(store);
}

export function searchChunks(sessionId, queryEmbedding, topK = 5) {
  const store = loadStore();
  const entries = store[sessionId] || [];
  return entries
    .map(e => ({ ...e, score: cosineSimilarity(queryEmbedding, e.embedding) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

export function clearSession(sessionId) {
  const store = loadStore();
  delete store[sessionId];
  saveStore(store);
}

export function getSessionDocs(sessionId) {
  const store = loadStore();
  const entries = store[sessionId] || [];
  return [...new Set(entries.map(e => e.docName))];
}
