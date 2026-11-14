import { TICKET_BATCH_LIMIT } from './limits';

/** One delivery ticket for a chat attachment (`POST .../attachment-tickets/`). Plain data; the URL is only ever used in-app. */
export type MediaTicket = {
  messageId: number;
  previewUrl: string;
  thumbUrl: string | null;
  /** Epoch ms. */
  expiresAt: number;
  kind: string;
  mime: string | null;
  size: number | null;
  etag: string | null;
  supportsRange: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function normalizeTicket(raw: unknown, now: number): MediaTicket | null {
  if (!isRecord(raw)) {
    return null;
  }

  const messageId = typeof raw.message_id === 'number' ? raw.message_id : Number(raw.message_id);
  const previewUrl = typeof raw.preview_url === 'string' ? raw.preview_url : '';

  if (!Number.isFinite(messageId) || !previewUrl) {
    return null;
  }

  const parsedExpiry = typeof raw.expires_at === 'string' ? Date.parse(raw.expires_at) : Number.NaN;

  return {
    messageId,
    previewUrl,
    thumbUrl: typeof raw.thumb_url === 'string' && raw.thumb_url ? raw.thumb_url : null,
    // A ticket without a readable expiry is treated as short-lived rather than trusted.
    expiresAt: Number.isFinite(parsedExpiry) ? parsedExpiry : now + 60_000,
    kind: typeof raw.kind === 'string' ? raw.kind : '',
    mime: typeof raw.mime === 'string' ? raw.mime : null,
    size: typeof raw.size === 'number' ? raw.size : null,
    etag: typeof raw.etag === 'string' && raw.etag ? raw.etag : null,
    supportsRange: raw.supports_range === true,
  };
}

/** Parses the batch response `{tickets, missing}` (already unwrapped from the envelope). */
export function normalizeTicketBatch(
  raw: unknown,
  now: number,
): { tickets: MediaTicket[]; missing: number[] } {
  const body = isRecord(raw) && isRecord(raw.data) ? raw.data : raw;
  const list = isRecord(body) && Array.isArray(body.tickets) ? body.tickets : [];
  const missing = isRecord(body) && Array.isArray(body.missing) ? body.missing : [];

  return {
    tickets: list.flatMap((entry) => {
      const ticket = normalizeTicket(entry, now);

      return ticket ? [ticket] : [];
    }),
    missing: missing.filter((id): id is number => typeof id === 'number'),
  };
}

/** A ticket is reused only while it has this much life left and has not been used up. */
const EXPIRY_MARGIN_MS = 20_000;
/** Server limits are 8 uses (images, files) and 128 (audio); stay well below the former. */
const MAX_USES_STILL = 5;
const MAX_USES_AUDIO = 100;

type Entry = { ticket: MediaTicket; uses: number };

/**
 * Remembers tickets for a short while so a screenful of thumbnails and the full image behind one of them cost one ticket
 * request, never more tickets than needed. A ticket is single-purpose in spirit: it is dropped as soon as it is nearly
 * expired or has served its allowance, and opening an attachment can always ask for a fresh one.
 */
export class TicketCache {
  private readonly entries = new Map<number, Entry>();

  put(tickets: readonly MediaTicket[]): void {
    for (const ticket of tickets) {
      this.entries.set(ticket.messageId, { ticket, uses: 0 });
    }
  }

  /** Returns a live ticket and counts one use of it, or null when a fresh one is needed. */
  take(messageId: number, now: number): MediaTicket | null {
    const entry = this.entries.get(messageId);

    if (!entry) {
      return null;
    }

    const limit =
      entry.ticket.kind === 'voice' || entry.ticket.kind === 'audio'
        ? MAX_USES_AUDIO
        : MAX_USES_STILL;

    if (entry.ticket.expiresAt - now <= EXPIRY_MARGIN_MS || entry.uses >= limit) {
      this.entries.delete(messageId);
      return null;
    }

    entry.uses += 1;

    return entry.ticket;
  }

  /** Forgets a ticket the server refused (expired early, membership changed). */
  invalidate(messageId: number): void {
    this.entries.delete(messageId);
  }

  clear(): void {
    this.entries.clear();
  }

  get size(): number {
    return this.entries.size;
  }
}

/** Ids that still need a ticket, de-duplicated, in batches the server accepts. */
export function planTicketBatches(
  ids: readonly number[],
  has: (id: number) => boolean,
  batchSize: number = TICKET_BATCH_LIMIT,
): number[][] {
  const wanted = Array.from(new Set(ids)).filter((id) => !has(id));
  const batches: number[][] = [];

  for (let index = 0; index < wanted.length; index += batchSize) {
    batches.push(wanted.slice(index, index + batchSize));
  }

  return batches;
}
