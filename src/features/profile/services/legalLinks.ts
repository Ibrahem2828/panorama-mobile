import * as WebBrowser from 'expo-web-browser';

import { env } from '../../../config/env';

export type LegalKind = 'privacy' | 'terms';

/** The standalone legal page configured for the app, or null when it is missing or not https. */
export function getLegalUrl(kind: LegalKind): string | null {
  const url = kind === 'privacy' ? env.privacyUrl : env.termsUrl;

  return url.startsWith('https://') ? url : null;
}

/**
 * Opens the configured legal page in the in-app browser. Returns false when none is
 * configured so the caller can show the built-in summary instead.
 */
export async function openLegalPage(kind: LegalKind): Promise<boolean> {
  const url = getLegalUrl(kind);

  if (!url) {
    return false;
  }

  await WebBrowser.openBrowserAsync(url);

  return true;
}
