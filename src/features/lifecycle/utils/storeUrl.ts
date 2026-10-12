import { Platform } from 'react-native';

import { fallbackStoreUrls } from '../../../constants/app';

/**
 * Picks the store link for the forced-update screen: the backend's `store_url` when it is
 * a safe scheme (https, or the Play `market:` scheme), otherwise the platform fallback.
 */
export function resolveStoreUrl(
  info: { storeUrl: string | null } | null,
  platform: string = Platform.OS,
): string {
  const candidate = info?.storeUrl ?? '';

  if (/^https:\/\//iu.test(candidate) || /^market:\/\//iu.test(candidate)) {
    return candidate;
  }

  return platform === 'ios' ? fallbackStoreUrls.ios : fallbackStoreUrls.android;
}
