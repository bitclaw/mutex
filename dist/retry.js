const defaultSleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
/** Backoff before the attempt after `attempt` (0-based): exponential plus jitter. */
export function backoffDelay(attempt, baseDelayMs, maxDelayMs, random = Math.random) {
    return Math.min(baseDelayMs * 2 ** attempt + random() * baseDelayMs, maxDelayMs);
}
/**
 * Run fn, retrying with exponential backoff and jitter while shouldRetry
 * says so. The last error is rethrown unchanged.
 */
export async function withRetry(fn, options = {}) {
    const { maxAttempts = 3, baseDelayMs = 100, maxDelayMs = 2000, shouldRetry = () => true, onRetry, sleep = defaultSleep, random = Math.random } = options;
    for (let attempt = 0;; attempt++) {
        try {
            return await fn();
        }
        catch (error) {
            if (attempt >= maxAttempts - 1 || !shouldRetry(error, attempt)) {
                throw error;
            }
            const delay = backoffDelay(attempt, baseDelayMs, maxDelayMs, random);
            onRetry?.(error, attempt, delay);
            await sleep(delay);
        }
    }
}
