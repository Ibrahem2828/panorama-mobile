import type { WhatsAppLaunchResult } from '../types';

// Only the two WhatsApp app-link shapes the backend can issue are accepted; anything else is refused.
const APP_LINK = /^whatsapp:\/\/(chat\?code=[A-Za-z0-9]{10,40}|send\?phone=\d{6,15})$/u;

export function parseWhatsAppAppLink(value: unknown): string | null {
  return typeof value === 'string' && APP_LINK.test(value) ? value : null;
}

type LaunchDeps = {
  /** Calls the launch endpoint; resolves with the raw `app_url` value. */
  requestAppUrl: () => Promise<unknown>;
  /** Opens the deep link (Linking.openURL); rejects when no app can handle it. */
  openUrl: (url: string) => Promise<unknown>;
};

/**
 * Opens WhatsApp straight into the group. The deep link lives only in memory for this call: it is
 * never returned, logged, rendered or put in a browser. Errors carry no link or token.
 */
export async function launchGroupWhatsApp({
  requestAppUrl,
  openUrl,
}: LaunchDeps): Promise<WhatsAppLaunchResult> {
  let link: string | null;

  try {
    link = parseWhatsAppAppLink(await requestAppUrl());
  } catch {
    return 'failed';
  }

  if (!link) {
    return 'failed';
  }

  try {
    await openUrl(link);
    return 'opened';
  } catch {
    return 'not-installed';
  }
}
