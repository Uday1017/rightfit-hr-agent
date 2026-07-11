import crypto from 'crypto';
import IORedis from 'ioredis';

const redis = new IORedis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,
});

// TTL of 7 days — cached screenings expire after a week
const CACHE_TTL = 60 * 60 * 24 * 7;

/**
 * SHA256 hash of cleaned resume text.
 * Same content = same hash, regardless of filename.
 */
export function hashResumeText(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

/**
 * Returns cached screening result if this exact resume+JD combo
 * was processed before. Returns null if no cache hit.
 */
export async function getCachedScreening(contentHash, jobDescription) {
  try {
    // Cache key includes a hash of the JD too — same resume against
    // different JDs should produce different screening results
    const jdHash = jobDescription
      ? crypto.createHash('sha256').update(jobDescription).digest('hex').slice(0, 16)
      : 'no-jd';

    const key = `screening:${contentHash}:${jdHash}`;
    const cached = await redis.get(key);

    if (cached) {
      console.log(`[HashCache] HIT — key ${key.slice(0, 30)}...`);
      return JSON.parse(cached);
    }

    console.log(`[HashCache] MISS — key ${key.slice(0, 30)}...`);
    return null;
  } catch (err) {
    // Cache errors should never block processing
    console.error('[HashCache] getCachedScreening error:', err.message);
    return null;
  }
}

/**
 * Stores a screening result in Redis against the content+JD hash.
 */
export async function setCachedScreening(contentHash, jobDescription, screening) {
  try {
    const jdHash = jobDescription
      ? crypto.createHash('sha256').update(jobDescription).digest('hex').slice(0, 16)
      : 'no-jd';

    const key = `screening:${contentHash}:${jdHash}`;
    await redis.setex(key, CACHE_TTL, JSON.stringify(screening));
    console.log(`[HashCache] STORED — key ${key.slice(0, 30)}...`);
  } catch (err) {
    console.error('[HashCache] setCachedScreening error:', err.message);
  }
}
