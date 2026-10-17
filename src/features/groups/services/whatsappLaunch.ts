import { normalizeApiError } from '../../../api';
import type { WhatsAppLaunchResult } from '../types';

// Only the two WhatsApp app-link shapes the backend can issue are accepted; anything else is refused.
const APP_LINK = /^whatsapp:\/\/(chat\?code=[A-Za-z0-9]{10,40}|send\?phone=\d{6,15})$/u;

export function parseWhatsAppAppLink(value: unknown): string | null {
  return typeof value === 'string' && APP_LINK.test(value) ? value : null;
}

/**
 * The server answers 400 "WhatsApp channel is not available for this group." when the group has no
 * channel yet. Matches on the status and that phrase only; nothing from the response is kept.
 */
export function isWhatsAppUnavailableError(error: unknown): boolean {
  const normalized = normalizeApiError(error);

  if (normalized.status !== 400) {
    return false;
  }

  let rawText = '';

  try {
    rawText = JSON.stringify(normalized.raw ?? '');
  } catch {
    rawText = '';
  }

  return [normalized.message, normalized.technicalMessage ?? '', rawText].some((text) =>
    /not available/iu.test(text),
  );
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
  } catch (error) {
    return isWhatsAppUnavailableError(error) ? 'unavailable' : 'failed';
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
