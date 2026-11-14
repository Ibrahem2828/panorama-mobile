export type RetryOptions = {
  attempts?: number;
  baseMs?: number;
  maxMs?: number;
  sleep?: (ms: number) => Promise<void>;
  random?: () => number;
  /** Return false to stop retrying (a definitive answer such as 403/404). */
  shouldRetry?: (error: unknown) => boolean;
};

const realSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Exponential backoff with jitter: ~400 ms, ~800 ms, ~1.6 s ... capped. */
export function backoffDelay(
  attempt: number,
  baseMs = 400,
  maxMs = 4000,
  random = Math.random,
): number {
  const exponential = Math.min(maxMs, baseMs * 2 ** attempt);

  return Math.round(exponential * (0.75 + random() * 0.5));
}

/** HTTP statuses worth another try: timeouts, throttling and server faults. Everything else is a final answer. */
export function isRetryableStatus(status: number | undefined): boolean {
  return (
    status === undefined || status === 408 || status === 425 || status === 429 || status >= 500
  );
}

/** Runs `task` up to `attempts` times, waiting between failures. The last error is rethrown. */
export async function withBackoff<T>(
  task: (attempt: number) => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const attempts = Math.max(1, options.attempts ?? 3);
  const sleep = options.sleep ?? realSleep;
  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await task(attempt);
    } catch (error) {
      lastError = error;

      if (attempt === attempts - 1 || options.shouldRetry?.(error) === false) {
        break;
      }

      await sleep(backoffDelay(attempt, options.baseMs, options.maxMs, options.random));
    }
  }

  throw lastError;
}
