export type RetryOptions = {
  /** Total attempts, including the first. Default 3. */
  maxAttempts?: number;
  /** First backoff; doubles per attempt, plus jitter. Default 100. */
  baseDelayMs?: number;
  /** Upper bound on one backoff. Default 2000. */
  maxDelayMs?: number;
  /** Which errors are worth another attempt. Default: every error. */
  shouldRetry?: (error: unknown, attempt: number) => boolean;
  /** Called before each backoff, e.g. to log. */
  onRetry?: (error: unknown, attempt: number, delayMs: number) => void;
  /** Override the wait, e.g. in tests. Default setTimeout. */
  sleep?: (ms: number) => Promise<void>;
  /** Override jitter, e.g. in tests. Default Math.random. */
  random?: () => number;
};

const defaultSleep = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

/** Backoff before the attempt after `attempt` (0-based): exponential plus jitter. */
export function backoffDelay(
  attempt: number,
  baseDelayMs: number,
  maxDelayMs: number,
  random: () => number = Math.random
): number {
  return Math.min(
    baseDelayMs * 2 ** attempt + random() * baseDelayMs,
    maxDelayMs
  );
}

/**
 * Run fn, retrying with exponential backoff and jitter while shouldRetry
 * says so. The last error is rethrown unchanged.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    baseDelayMs = 100,
    maxDelayMs = 2000,
    shouldRetry = () => true,
    onRetry,
    sleep = defaultSleep,
    random = Math.random
  } = options;

  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      if (attempt >= maxAttempts - 1 || !shouldRetry(error, attempt)) {
        throw error;
      }
      const delay = backoffDelay(attempt, baseDelayMs, maxDelayMs, random);
      onRetry?.(error, attempt, delay);
      await sleep(delay);
    }
  }
}
