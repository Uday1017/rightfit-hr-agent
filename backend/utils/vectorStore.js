import { QdrantClient } from '@qdrant/js-client-rest';
import { v4 as uuidv4 } from 'uuid';

const COLLECTION = 'resumes';

const client = new QdrantClient({ url: process.env.QDRANT_URL || 'http://localhost:6333' });

async function ensureCollection(vectorSize) {
  const { collections } = await client.getCollections();
  if (!collections.find(c => c.name === COLLECTION) && vectorSize > 0) {
    await client.createCollection(COLLECTION, {
      vectors: { size: vectorSize, distance: 'Cosine' },
    });
  }
}

export async function addChunk(sessionId, docName, chunk, embedding) {
  await ensureCollection(embedding.length);
  await client.upsert(COLLECTION, {
    points: [{
      id: uuidv4(),
      vector: embedding,
      payload: { sessionId, docName, text: chunk.text, chunkId: chunk.id },
    }],
  });
}

export async function searchChunks(sessionId, queryEmbedding, topK = 5) {
  await ensureCollection(queryEmbedding.length);
  const results = await client.search(COLLECTION, {
    vector: queryEmbedding,
    limit: topK,
    filter: { must: [{ key: 'sessionId', match: { value: sessionId } }] },
    with_payload: true,
  });
  return results.map(r => ({ ...r.payload, score: r.score }));
}

export async function clearSession(sessionId) {
  await ensureCollection(0);
  await client.delete(COLLECTION, {
    filter: { must: [{ key: 'sessionId', match: { value: sessionId } }] },
  });
}

export async function getSessionDocs(sessionId) {
  await ensureCollection(0);
  const results = await client.scroll(COLLECTION, {
    filter: { must: [{ key: 'sessionId', match: { value: sessionId } }] },
    with_payload: ['docName'],
    limit: 1000,
  });
  return [...new Set(results.points.map(p => p.payload.docName))];
}
