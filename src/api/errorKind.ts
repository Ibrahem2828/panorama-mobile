import { normalizeApiError } from './errors';

/** The failure families the app tells apart on screen; each has its own illustrated state and copy. */
export type ErrorKind = 'offline' | 'weak' | 'timeout' | 'notFound' | 'server' | 'generic';

/**
 * Classifies a failed request for the error screens.
 *
 * - no connection at all (NetInfo says offline, or a network failure while it does)  -> offline
 * - the request never completed although the device looks connected               -> weak (weak or intermittent link)
 * - the request ran out of time (AbortError, 408, 504)                            -> timeout
 * - 404 / 410                                                                       -> notFound
 * - 5xx and maintenance                                                             -> server
 * - everything else                                                                 -> generic
 */
export function classifyApiError(
  error: unknown,
  options: { deviceOnline?: boolean } = {},
): ErrorKind {
  const normalized = normalizeApiError(error);
  const offline = options.deviceOnline === false;
  const { status } = normalized;

  if (normalized.code === 'NETWORK_ERROR') return offline ? 'offline' : 'weak';
  if (normalized.code === 'TIMEOUT' || status === 408 || status === 504) {
    return offline ? 'offline' : 'timeout';
  }
  if (normalized.code === 'NOT_FOUND' || status === 404 || status === 410) return 'notFound';
  if (normalized.code === 'MAINTENANCE_MODE' || (status !== undefined && status >= 500)) {
    return 'server';
  }
  if (normalized.code === 'SERVER_ERROR') return 'server';

  return 'generic';
}
