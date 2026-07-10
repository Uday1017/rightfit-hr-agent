import CircuitBreaker from 'opossum';

/**
 * Singleton circuit breaker instance protecting Gemini API calls.
 * Fails fast after 5 consecutive failures, waits 60 seconds, then retries.
 */
const breaker = new CircuitBreaker(async (fn) => fn(), {
  timeout: 30000,                    // 30 seconds per call
  errorThresholdPercentage: 50,      // open after 50% failure rate
  resetTimeout: 60000,               // wait 60 seconds before half-open test
  volumeThreshold: 5,                // need 5 calls to measure failure rate
  name: 'gemini-breaker',
});

// Log state transitions
breaker.on('open', () => {
  console.warn('[CircuitBreaker] OPEN — Gemini unavailable, failing fast for 60s');
});

breaker.on('halfOpen', () => {
  console.log('[CircuitBreaker] HALF-OPEN — testing recovery...');
});

breaker.on('close', () => {
  console.log('[CircuitBreaker] CLOSED — service recovered, resuming normal operation');
});

breaker.on('success', () => {
  // log at debug level to avoid noise
  // console.debug('[CircuitBreaker] request succeeded');
});

breaker.on('failure', () => {
  // log at debug level
  // console.debug('[CircuitBreaker] request failed');
});

/**
 * Execute an async function through the circuit breaker.
 * If the breaker is open, fails fast with error: "Circuit breaker is open"
 *
 * @param {Function} fn - async function to execute
 * @returns {Promise} result of fn() if successful
 */
export async function fireWithBreaker(fn) {
  return breaker.fire(fn);
}

/**
 * Check current circuit breaker state (for diagnostics/logging)
 */
export function getBreakerState() {
  return breaker.opened ? 'OPEN' : breaker.halfOpen ? 'HALF-OPEN' : 'CLOSED';
}

export { breaker };
