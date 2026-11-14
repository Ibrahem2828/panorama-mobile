import { groupsService, normalizeApiError, refreshAccessTokenOnce } from '../../../../api';
import { toBase64 } from '../../../../security/encryptedStoreCore';
import { isTrustedBackendUrl } from '../../../../utils/trustedUrl';
import { useAuthStore } from '../../../auth/store';
import type { Id } from '../../types';
import { cacheKey, canStore, decideCacheUse, type CacheVariant } from '../logic/cacheIndex';
import { classifyOpenFailure, type OpenFailure } from '../logic/errors';
import { isRetryableStatus, withBackoff } from '../logic/retry';
import {
  normalizeTicket,
  normalizeTicketBatch,
  TicketCache,
  type MediaTicket,
} from '../logic/tickets';
import {
  getChatMediaStore,
  onChatMediaCleared,
  recallThumb,
  rememberThumb,
} from './chatMediaStore';

export const CHAT_ATTACHMENT_PATH_PREFIX = '/api/v1/protected-chat-attachments/';

/** How long ticket requests for one screenful are collected into a single batch call. */
const BATCH_WINDOW_MS = 40;

/** Failure of opening a chat attachment, already classified for the UI. */
export class MediaOpenError extends Error {
  readonly failure: OpenFailure;
  readonly status: number | undefined;

  constructor(failure: OpenFailure, status?: number) {
    super(`Chat media failure: ${failure}`);
    this.failure = failure;
    this.status = status;
  }
}

const tickets = new TicketCache();

type Waiter = { resolve: (ticket: MediaTicket) => void; reject: (error: unknown) => void };
type Queue = { ids: Map<number, Waiter[]>; timer: ReturnType<typeof setTimeout> | null };

const queues = new Map<string, Queue>();

function accessToken(): string {
  const token = useAuthStore.getState().accessToken;

  if (!token) {
    throw new MediaOpenError('forbidden', 401);
  }

  return token;
}

function failureOf(error: unknown): MediaOpenError {
  if (error instanceof MediaOpenError) {
    return error;
  }

  const normalized = normalizeApiError(error);

  return new MediaOpenError(
    classifyOpenFailure({
      status: normalized.status,
      network: normalized.code === 'NETWORK_ERROR' || normalized.code === 'TIMEOUT',
      code: normalized.code,
    }),
    normalized.status,
  );
}

function trusted(url: string): boolean {
  return isTrustedBackendUrl(url, {
    pathPrefixes: [CHAT_ATTACHMENT_PATH_PREFIX],
    allowHttpInDevelopment: true,
  });
}

async function flush(groupId: Id, queue: Queue): Promise<void> {
  const entries = [...queue.ids.entries()];

  queue.ids.clear();
  queue.timer = null;

  const ids = entries.map(([id]) => id);
  const settle = (id: number, action: (waiter: Waiter) => void) =>
    entries.find(([candidate]) => candidate === id)?.[1].forEach(action);

  try {
    const response = await withBackoff(
      () => groupsService.requestGroupMessageAttachmentTickets(groupId, ids, accessToken()),
      { attempts: 2, shouldRetry: (error) => isRetryableStatus(normalizeApiError(error).status) },
    );
    const batch = normalizeTicketBatch(response, Date.now());
    const valid = batch.tickets.filter((ticket) => trusted(ticket.previewUrl));

    tickets.put(valid);

    for (const id of ids) {
      const ticket = valid.find((candidate) => candidate.messageId === id);

      if (ticket) {
        settle(id, (waiter) => waiter.resolve(ticket));
      } else {
        settle(id, (waiter) => waiter.reject(new MediaOpenError('gone', 404)));
      }
    }
  } catch (error) {
    const failure = failureOf(error);

    ids.forEach((id) => settle(id, (waiter) => waiter.reject(failure)));
  }
}

/**
 * A ticket for one message. Tickets asked for within a few milliseconds of each other (a screenful of thumbnails) share ONE
 * batch request. A cached ticket is reused only while it is far from expiry and has uses left; `fresh` always asks the server.
 */
export function getTicket(
  groupId: Id,
  messageId: number,
  options: { fresh?: boolean } = {},
): Promise<MediaTicket> {
  if (!options.fresh) {
    const cached = tickets.take(messageId, Date.now());

    if (cached) {
      return Promise.resolve(cached);
    }
  } else {
    tickets.invalidate(messageId);
  }

  if (options.fresh) {
    return withBackoff(
      async () => {
        const raw = await groupsService.requestGroupMessageAttachmentTicket(
          groupId,
          messageId,
          accessToken(),
        );
        const ticket = normalizeTicket(raw, Date.now());

        if (!ticket || !trusted(ticket.previewUrl)) {
          throw new MediaOpenError('server');
        }

        return ticket;
      },
      { attempts: 2, shouldRetry: (error) => isRetryableStatus(normalizeApiError(error).status) },
    ).catch((error: unknown) => {
      throw failureOf(error);
    });
  }

  const key = String(groupId);
  const queue = queues.get(key) ?? { ids: new Map<number, Waiter[]>(), timer: null };

  queues.set(key, queue);

  return new Promise<MediaTicket>((resolve, reject) => {
    queue.ids.set(messageId, [...(queue.ids.get(messageId) ?? []), { resolve, reject }]);

    if (!queue.timer) {
      queue.timer = setTimeout(() => void flush(groupId, queue), BATCH_WINDOW_MS);
    }
  });
}

type Fetched =
  | { status: 'ok'; bytes: Uint8Array; etag: string | null; mime: string }
  | { status: 'notModified' };

async function fetchOnce(url: string, token: string, etag: string | null): Promise<Response> {
  const headers: Record<string, string> = { Authorization: `Bearer ${token}` };

  if (etag) {
    headers['If-None-Match'] = etag;
  }

  return fetch(url, { headers });
}

/** GET of a ticket URL with the auth header, a refresh on 401, and backoff on network/5xx errors. */
async function fetchMedia(url: string, etag: string | null): Promise<Fetched> {
  if (!trusted(url)) {
    throw new MediaOpenError('server');
  }

  return withBackoff(
    async () => {
      let token = accessToken();
      let response: Response;

      try {
        response = await fetchOnce(url, token, etag);

        if (response.status === 401) {
          token = (await refreshAccessTokenOnce()) ?? token;
          response = await fetchOnce(url, token, etag);
        }
      } catch {
        throw new MediaOpenError('offline');
      }

      if (response.status === 304) {
        return { status: 'notModified' } as const;
      }

      if (!response.ok) {
        throw new MediaOpenError(classifyOpenFailure({ status: response.status }), response.status);
      }

      return {
        status: 'ok',
        bytes: new Uint8Array(await response.arrayBuffer()),
        etag: response.headers.get('etag'),
        mime:
          (response.headers.get('content-type') ?? 'application/octet-stream').split(';')[0] ?? '',
      } as const;
    },
    {
      attempts: 3,
      shouldRetry: (error) =>
        error instanceof MediaOpenError &&
        (error.failure === 'offline' || isRetryableStatus(error.status)),
    },
  );
}

export type MediaSource = 'cache' | 'revalidated' | 'network';

/**
 * Makes sure the encrypted cache holds the thumbnail or the full attachment and says where it came from.
 *
 *  - fresh ticket (batched) -> compare the ticket's content hash with the stored copy: equal = reuse, nothing is downloaded
 *  - otherwise conditional GET (If-None-Match): 304 = reuse, 200 = replace the copy
 *  - offline (the ticket cannot be fetched) and a copy exists = serve the copy
 *  - 403/404/410 = the member lost access or the message is gone: the stored copy is deleted and the error is thrown
 */
export async function ensureCached(input: {
  groupId: Id;
  messageId: number;
  variant: CacheVariant;
}): Promise<{ key: string; source: MediaSource }> {
  const userId = useAuthStore.getState().user?.id ?? 'anon';
  const key = cacheKey(userId, input.messageId, input.variant);
  const store = getChatMediaStore();
  const meta = await store.getMeta(key);
  let ticket: MediaTicket;

  try {
    ticket = await getTicket(input.groupId, input.messageId);
  } catch (error) {
    const failure = failureOf(error);

    if (failure.failure === 'offline' && meta) {
      return { key, source: 'cache' };
    }

    if (failure.failure === 'gone' || failure.failure === 'forbidden') {
      await store.evict(key);
    }

    throw failure;
  }

  const decision = decideCacheUse(
    meta
      ? {
          etag: typeof meta.etag === 'string' ? meta.etag : null,
          parent: typeof meta.parent === 'string' ? meta.parent : null,
        }
      : null,
    ticket.etag,
  );

  if (decision.action === 'reuse') {
    return { key, source: 'cache' };
  }

  const url = input.variant === 'thumb' ? ticket.thumbUrl : ticket.previewUrl;

  if (!url) {
    throw new MediaOpenError('gone', 404);
  }

  let result: Fetched;

  try {
    result = await fetchMedia(url, decision.action === 'conditional' ? decision.etag : null);
  } catch (error) {
    const failure = failureOf(error);

    if (failure.failure === 'offline' && meta) {
      return { key, source: 'cache' };
    }

    if (failure.failure === 'gone' || failure.failure === 'forbidden') {
      tickets.invalidate(input.messageId);
      await store.evict(key);
    }

    throw failure;
  }

  if (result.status === 'notModified') {
    await store.setMeta(key, { ...(meta ?? {}), parent: ticket.etag });

    return { key, source: 'revalidated' };
  }

  if (!canStore(result.bytes.length)) {
    throw new MediaOpenError('server');
  }

  await store.put(key, result.bytes, { etag: result.etag, parent: ticket.etag, mime: result.mime });

  return { key, source: 'network' };
}

/** Thumbnail as a data URI (memory only). Small and fast: the list never waits for the full image. */
export async function loadThumbnailUri(groupId: Id, messageId: number): Promise<string> {
  const userId = useAuthStore.getState().user?.id ?? 'anon';
  const key = cacheKey(userId, messageId, 'thumb');
  const remembered = recallThumb(key);

  if (remembered) {
    return remembered;
  }

  const { key: storedKey } = await ensureCached({ groupId, messageId, variant: 'thumb' });
  const store = getChatMediaStore();
  const bytes = await store.readBytes(storedKey);

  if (!bytes) {
    throw new MediaOpenError('server');
  }

  const meta = await store.getMeta(storedKey);
  const mime =
    typeof meta?.mime === 'string' && meta.mime.startsWith('image/') ? meta.mime : 'image/webp';
  const uri = `data:${mime};base64,${toBase64(bytes)}`;

  rememberThumb(key, uri);

  return uri;
}

/** Full attachment as a decrypted temp file (image / document). The caller MUST `release()` it when the viewer closes. */
export async function openFullAttachment(groupId: Id, messageId: number) {
  const { key, source } = await ensureCached({ groupId, messageId, variant: 'full' });
  const opened = await getChatMediaStore().open(key);

  if (!opened) {
    throw new MediaOpenError('server');
  }

  return { opened, source };
}

/** Streaming source for audio: a fresh ticket per start (audio tickets live 10 minutes), with the auth header. */
export async function getAudioSource(
  groupId: Id,
  messageId: number,
): Promise<{ uri: string; headers: Record<string, string> }> {
  const ticket = await getTicket(groupId, messageId, { fresh: true });

  return { uri: ticket.previewUrl, headers: { Authorization: `Bearer ${accessToken()}` } };
}

export function forgetTickets(): void {
  tickets.clear();
}

onChatMediaCleared(forgetTickets);
