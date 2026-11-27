# @bitclaw/mutex

Promise mutex, per-key mutex map and retry with exponential backoff. Zero dependencies and no runtime APIs, so it runs anywhere JavaScript does: Node, Bun, browsers, React Native, Electron.

> Part of [Warpkit](https://warpkit.dev/?utm_source=github&utm_medium=readme), my TypeScript SaaS starter.
> I'm open for consulting on this kind of work: [bitclaw.com/hire](https://bitclaw.com/hire?utm_source=github&utm_medium=readme).

## Install

```bash
npm install @bitclaw/mutex
```

## WriteMutex

Callers run one at a time, in call order.

```ts
import { WriteMutex } from '@bitclaw/mutex';

const sync = new WriteMutex();

// A network change and an app resume both trigger a sync; they never overlap.
await sync.acquire(() => flushQueue());
```

`mutex.locked` is true while a caller is queued or running. Check it before closing what the mutex guards.

## WriteMutexMap

One mutex per key, created on first use.

```ts
import { WriteMutexMap } from '@bitclaw/mutex';

const locks = new WriteMutexMap();
await locks.withLock(userId, () => writeUserData(userId));
```

## withRetry

Retries with exponential backoff and jitter while `shouldRetry` allows it, then rethrows the last error unchanged.

```ts
import { withRetry } from '@bitclaw/mutex';

const isBusy = (error: unknown) =>
  error instanceof Error && error.message.includes('database is locked');

await withRetry(() => db.write(row), {
  maxAttempts: 5,
  shouldRetry: isBusy,
  onRetry: (error, attempt, delayMs) => console.warn(`retry ${attempt + 1} in ${delayMs}ms`)
});
```

| Option | Default |
|---|---|
| `maxAttempts` | `3` (includes the first) |
| `baseDelayMs` | `100`, doubled per attempt, plus up to `baseDelayMs` of jitter |
| `maxDelayMs` | `2000` |
| `shouldRetry` | every error |
| `onRetry` | none |
| `sleep`, `random` | `setTimeout`, `Math.random`; inject them to test without waiting |

## License

MIT
