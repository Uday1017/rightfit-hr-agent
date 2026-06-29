import { Langfuse } from 'langfuse';

const enabled = !!(process.env.LANGFUSE_PUBLIC_KEY && process.env.LANGFUSE_SECRET_KEY);

export const langfuse = enabled
  ? new Langfuse({
      publicKey: process.env.LANGFUSE_PUBLIC_KEY,
      secretKey: process.env.LANGFUSE_SECRET_KEY,
      baseUrl: process.env.LANGFUSE_HOST || 'http://localhost:3000',
    })
  : null;

// Returns a no-op trace object when Langfuse is not configured
export function createTrace(name, metadata = {}) {
  if (!langfuse) return nullTrace();
  return langfuse.trace({ name, metadata });
}

function nullTrace() {
  const noop = () => nullSpan();
  return { span: noop, generation: noop, update: () => {}, end: () => {} };
}

function nullSpan() {
  return { end: () => {}, update: () => {} };
}
