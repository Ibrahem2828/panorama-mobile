import { createApiError, normalizeApiError } from '../api/errors';
import { useLocaleStore } from '../i18n';
import { buildCacheKey, isCacheablePath } from './cachePolicy';
import { getCacheScope } from './cacheScope';
import { isDeviceOffline, useNetworkStore } from './networkStore';
import { readCache, writeCache } from './responseCache';

/**
 * With a connection, the network answer is waited for this long; past it a saved copy (if any) is shown right away and the
 * request keeps running in the background to refresh the saved copy. This is what makes a bad connection feel instant.
 */
export const SOFT_TIMEOUT_MS = 3000;

export type CachedRequestInput = {
  path: string;
  query?: Record<string, string | number | boolean | null | undefined>;
  /** Runs the real network request. */
  fetcher: () => Promise<unknown>;
  noCache?: boolean;
  softTimeoutMs?: number;
};

export function offlineError() {
  return createApiError({
    code: 'NETWORK_ERROR',
    message: useLocaleStore.getState().t.apiErrors.offline,
    details: { offline: true },
  });
}

function isServeableFailure(error: unknown): boolean {
  const { code, status } = normalizeApiError(error);

  return code === 'NETWORK_ERROR' || code === 'TIMEOUT' || (status !== undefined && status >= 500);
}

/** Whether a GET to `path` takes part in the offline cache right now. */
export function shouldUseCache(path: string, noCache?: boolean): boolean {
  return !noCache && getCacheScope() !== null && isCacheablePath(path);
}

/**
 * A GET that is saved on success and answered from the saved copy when the device is offline, the server is unreachable
 * or answers 5xx. Non-cacheable requests fail fast when the device is offline. Never used for writes.
 */
export async function cachedGet<T>(input: CachedRequestInput): Promise<T> {
  const scope = getCacheScope();

  if (!scope || !shouldUseCache(input.path, input.noCache)) {
    if (isDeviceOffline()) {
      throw offlineError();
    }

    return (await input.fetcher()) as T;
  }

  const key = buildCacheKey(input.path, input.query);
  const network = useNetworkStore.getState();

  const serve = (hit: { data: unknown; savedAt: number }) => {
    network.markServedFromCache(hit.savedAt);

    return hit.data as T;
  };

  if (isDeviceOffline()) {
    const hit = await readCache<unknown>(scope, key);

    if (hit) {
      return serve(hit);
    }

    throw offlineError();
  }

  const live = input.fetcher().then((data) => {
    // Written for the user the request was made for, even if the screen has moved on.
    void writeCache(scope, key, data);
    useNetworkStore.getState().markFresh();

    return data;
  });

  const soft = input.softTimeoutMs ?? SOFT_TIMEOUT_MS;

  try {
    if (soft <= 0) {
      return (await live) as T;
    }

    let timer: ReturnType<typeof setTimeout> | undefined;
    const slow = new Promise<'slow'>((resolve) => {
      timer = setTimeout(() => resolve('slow'), soft);
    });

    try {
      const first = await Promise.race([live, slow]);

      if (first !== 'slow') {
        return first as T;
      }
    } finally {
      clearTimeout(timer);
    }

    const hit = await readCache<unknown>(scope, key);

    if (hit) {
      // The live request keeps running; its failure must not surface as an unhandled rejection.
      live.catch(() => undefined);

      return serve(hit);
    }

    return (await live) as T;
  } catch (error) {
    if (isServeableFailure(error)) {
      const hit = await readCache<unknown>(scope, key);

      if (hit) {
        return serve(hit);
      }
    }

    throw error;
  }
}
