import { PREPARING_MAX_ATTEMPTS } from './licenseLogic';

/** One answer of the license endpoint: the license, or "the server is still building the package, ask again". */
export type LicenseAttempt<T> =
  | { kind: 'license'; license: T }
  | { kind: 'preparing'; delayMs: number };

export class PreparingTimeoutError extends Error {
  constructor() {
    super('The offline package was not ready in time');
  }
}

export class PreparingCancelledError extends Error {
  constructor() {
    super('Preparing cancelled');
  }
}

/**
 * Repeats the license request while the server answers 202 `preparing` (big library files are packaged by a worker), waiting the
 * server's `retry_after_seconds` between attempts, until a license arrives, the caller cancels, or the attempts run out.
 * Pure: the clock, the request and the cancellation are injected so the loop is unit tested without timers.
 */
export async function issueWithPreparing<T>(deps: {
  attempt: () => Promise<LicenseAttempt<T>>;
  sleep: (ms: number) => Promise<void>;
  isCancelled: () => boolean;
  onPreparing?: (attempt: number) => void;
  maxAttempts?: number;
}): Promise<T> {
  const max = deps.maxAttempts ?? PREPARING_MAX_ATTEMPTS;

  for (let attempt = 1; attempt <= max; attempt += 1) {
    if (deps.isCancelled()) {
      throw new PreparingCancelledError();
    }

    const result = await deps.attempt();

    if (result.kind === 'license') {
      return result.license;
    }

    deps.onPreparing?.(attempt);
    await deps.sleep(result.delayMs);
  }

  throw new PreparingTimeoutError();
}
