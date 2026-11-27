import { describe, expect, test } from 'bun:test';
import { backoffDelay, withRetry } from './retry.js';

// No real waiting: every test records the delays it would have slept.
const recorder = () => {
  const delays: number[] = [];
  return { delays, sleep: async (ms: number) => void delays.push(ms) };
};

const failing = (failures: number, error: unknown = new Error('busy')) => {
  let calls = 0;
  const fn = async () => {
    calls++;
    if (calls <= failures) throw error;
    return calls;
  };
  return { fn, calls: () => calls };
};

describe('withRetry', () => {
  test('returns the first success without waiting', async () => {
    const { delays, sleep } = recorder();
    expect(await withRetry(async () => 42, { sleep })).toBe(42);
    expect(delays).toEqual([]);
  });

  test('retries until fn succeeds', async () => {
    const { delays, sleep } = recorder();
    const op = failing(2);
    expect(await withRetry(op.fn, { sleep, random: () => 0 })).toBe(3);
    expect(delays).toEqual([100, 200]);
  });

  test('rethrows the last error after maxAttempts', async () => {
    const { sleep } = recorder();
    const error = new Error('still busy');
    const op = failing(10, error);
    await expect(withRetry(op.fn, { sleep, maxAttempts: 4 })).rejects.toBe(
      error
    );
    expect(op.calls()).toBe(4);
  });

  test('does not retry an error shouldRetry rejects', async () => {
    const { delays, sleep } = recorder();
    const op = failing(1, new Error('syntax error'));
    await expect(
      withRetry(op.fn, {
        sleep,
        shouldRetry: error => error instanceof Error && error.message === 'busy'
      })
    ).rejects.toThrow('syntax error');
    expect(op.calls()).toBe(1);
    expect(delays).toEqual([]);
  });

  test('reports each retry before waiting', async () => {
    const { sleep } = recorder();
    const seen: Array<[number, number]> = [];
    await withRetry(failing(2).fn, {
      sleep,
      random: () => 0,
      onRetry: (_error, attempt, delay) => seen.push([attempt, delay])
    });
    expect(seen).toEqual([
      [0, 100],
      [1, 200]
    ]);
  });
});

describe('backoffDelay', () => {
  test('doubles per attempt and adds jitter', () => {
    expect(backoffDelay(0, 100, 2000, () => 0)).toBe(100);
    expect(backoffDelay(3, 100, 2000, () => 0.5)).toBe(850);
  });

  test('never exceeds maxDelayMs', () => {
    expect(backoffDelay(10, 100, 2000, () => 1)).toBe(2000);
  });
});
