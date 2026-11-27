/**
 * An async mutex: callers of acquire() run one at a time, in call order.
 * JavaScript runs one task at a time per thread, so a promise queue is
 * enough; no atomics.
 */
export class WriteMutex {
  private queue: Promise<void> = Promise.resolve();
  private active = 0;

  /**
   * True while at least one caller is queued on or executing inside
   * acquire(). Callers that close or evict the resource this mutex guards
   * must check this first: closing it under a queued or running acquire()
   * defeats the serialization.
   */
  get locked(): boolean {
    return this.active > 0;
  }

  /** Run fn once every earlier acquire() has settled. */
  async acquire<T>(fn: () => T | Promise<T>): Promise<T> {
    this.active++;
    let release!: () => void;
    const gate = new Promise<void>(resolve => {
      release = resolve;
    });

    const prior = this.queue;
    this.queue = gate;

    try {
      await prior;
      return await fn();
    } finally {
      release();
      this.active--;
    }
  }
}

/** One WriteMutex per key, created on first use. */
export class WriteMutexMap {
  private mutexes = new Map<string, WriteMutex>();

  /** Run fn under the mutex for key. */
  async withLock<T>(key: string, fn: () => T | Promise<T>): Promise<T> {
    let mutex = this.mutexes.get(key);
    if (!mutex) {
      mutex = new WriteMutex();
      this.mutexes.set(key, mutex);
    }
    return mutex.acquire(fn);
  }

  /** Forget the mutex for key, e.g. when evicting what it guards. */
  delete(key: string): void {
    this.mutexes.delete(key);
  }

  /**
   * True if the mutex for key has a caller queued or running. A key with
   * no mutex yet is never locked.
   */
  isLocked(key: string): boolean {
    return this.mutexes.get(key)?.locked ?? false;
  }

  /** Number of tracked mutexes. */
  get size(): number {
    return this.mutexes.size;
  }
}
