import { Queue } from 'bullmq';

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
};

export const resumeQueue = new Queue('resume-processing', { connection });

export async function enqueueResume(data) {
  const job = await resumeQueue.add('process-resume', data, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
  });
  return job.id;
}
