/**
 * An async mutex: callers of acquire() run one at a time, in call order.
 * JavaScript runs one task at a time per thread, so a promise queue is
 * enough; no atomics.
 */
export declare class WriteMutex {
    private queue;
    private active;
    /**
     * True while at least one caller is queued on or executing inside
     * acquire(). Callers that close or evict the resource this mutex guards
     * must check this first: closing it under a queued or running acquire()
     * defeats the serialization.
     */
    get locked(): boolean;
    /** Run fn once every earlier acquire() has settled. */
    acquire<T>(fn: () => T | Promise<T>): Promise<T>;
}
/** One WriteMutex per key, created on first use. */
export declare class WriteMutexMap {
    private mutexes;
    /** Run fn under the mutex for key. */
    withLock<T>(key: string, fn: () => T | Promise<T>): Promise<T>;
    /** Forget the mutex for key, e.g. when evicting what it guards. */
    delete(key: string): void;
    /**
     * True if the mutex for key has a caller queued or running. A key with
     * no mutex yet is never locked.
     */
    isLocked(key: string): boolean;
    /** Number of tracked mutexes. */
    get size(): number;
}
//# sourceMappingURL=write-mutex.d.ts.map