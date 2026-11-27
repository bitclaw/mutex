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
/** Backoff before the attempt after `attempt` (0-based): exponential plus jitter. */
export declare function backoffDelay(attempt: number, baseDelayMs: number, maxDelayMs: number, random?: () => number): number;
/**
 * Run fn, retrying with exponential backoff and jitter while shouldRetry
 * says so. The last error is rethrown unchanged.
 */
export declare function withRetry<T>(fn: () => Promise<T>, options?: RetryOptions): Promise<T>;
//# sourceMappingURL=retry.d.ts.map