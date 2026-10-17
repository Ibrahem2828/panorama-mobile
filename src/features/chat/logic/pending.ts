import type { ChatAttachment, ChatMessage, Id, PendingMessage } from '../types';
import { isOwnChatMessage } from './messages';

/**
 * Optimistic-send state machine (pure; the store owns the I/O):
 *
 *   createPending -> sending --(server confirms)--> removed
 *                       |
 *                       +--(error)--> failed --(retry)--> sending
 *                                        |
 *                                        +--(discard)--> removed
 */

export function createPending(input: {
  localId: string;
  idempotencyKey: string;
  content: string;
  attachment?: ChatAttachment | null;
  now: Date;
}): PendingMessage {
  return {
    localId: input.localId,
    idempotencyKey: input.idempotencyKey,
    content: input.content,
    attachment: input.attachment ?? null,
    status: 'sending',
    createdAt: input.now.toISOString(),
    progress: 0,
    error: null,
    keyBurned: false,
  };
}

function update(
  list: readonly PendingMessage[],
  localId: string,
  change: (item: PendingMessage) => PendingMessage,
): PendingMessage[] {
  return list.map((item) => (item.localId === localId ? change(item) : item));
}

/** Failed -> sending. A key the server already answered definitively is replaced first. */
export function markSending(
  list: readonly PendingMessage[],
  localId: string,
  newKey: () => string,
): PendingMessage[] {
  return update(list, localId, (item) => ({
    ...item,
    idempotencyKey: item.keyBurned ? newKey() : item.idempotencyKey,
    keyBurned: false,
    status: 'sending',
    error: null,
    progress: 0,
  }));
}

export function setProgress(
  list: readonly PendingMessage[],
  localId: string,
  fraction: number,
): PendingMessage[] {
  const progress = Math.max(0, Math.min(1, fraction));

  return update(list, localId, (item) =>
    item.status === 'sending' && item.progress !== progress ? { ...item, progress } : item,
  );
}

export function markFailed(
  list: readonly PendingMessage[],
  localId: string,
  error: string,
  definitive: boolean,
): PendingMessage[] {
  return update(list, localId, (item) => ({
    ...item,
    status: 'failed',
    error,
    keyBurned: definitive,
  }));
}

export function removePending(
  list: readonly PendingMessage[],
  localId: string,
): readonly PendingMessage[] {
  return list.some((item) => item.localId === localId)
    ? list.filter((item) => item.localId !== localId)
    : list;
}

/**
 * The backend also pushes REST-created messages over the socket, so the sender can receive
 * its own message before the REST response lands. Returns the "sending" bubble this server
 * message confirms (same author, same text, same attachment presence) so it can be dropped
 * instead of rendering next to the confirmed copy.
 */
export function findMatchingPending(
  list: readonly PendingMessage[],
  message: ChatMessage,
  currentUserId: Id | null | undefined,
): PendingMessage | null {
  if (!isOwnChatMessage(message, currentUserId)) {
    return null;
  }

  return (
    list.find(
      (item) =>
        item.status === 'sending' &&
        item.content.trim() === message.content.trim() &&
        (item.attachment !== null) === message.has_attachment,
    ) ?? null
  );
}

/** True for definitive 4xx answers (except throttling), where the same key must not be reused. */
export function isDefinitiveRejection(status: number | undefined, code: string): boolean {
  return (
    typeof status === 'number' &&
    status >= 400 &&
    status < 500 &&
    code !== 'RATE_LIMITED' &&
    code !== 'IDEMPOTENCY_IN_PROGRESS'
  );
}
