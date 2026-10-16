import type { ChatListItem, ChatMessage, Id, PendingMessage } from '../types';
import { isOwnChatMessage } from './messages';

/** A new sender run starts after this much silence even from the same person. */
export const GROUP_GAP_MS = 5 * 60 * 1000;

export function dayKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function dayKeyOf(value: string): string {
  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? 'unknown' : dayKey(date);
}

/**
 * Builds the rows of the inverted list: newest first, with a day separator after (= visually
 * above) the first message of each calendar day, and `groupStart` marking the first message
 * of a run by the same sender. Pending bubbles are always the newest rows.
 */
export function buildChatItems(
  messages: readonly ChatMessage[],
  pending: readonly PendingMessage[],
  currentUserId: Id | null | undefined,
): ChatListItem[] {
  const ascending: ChatListItem[] = [];
  let previousDay: string | null = null;
  let previousSender: string | null = null;
  let previousTime = 0;

  function place(createdAt: string, sender: string | null) {
    const day = dayKeyOf(createdAt);
    const time = new Date(createdAt).getTime();
    const newDay = day !== previousDay;

    if (newDay) {
      ascending.push({ kind: 'day', key: `d-${day}`, date: createdAt });
    }

    const groupStart =
      newDay ||
      sender === null ||
      sender !== previousSender ||
      (Number.isFinite(time) && time - previousTime > GROUP_GAP_MS);

    previousDay = day;
    previousSender = sender;
    previousTime = Number.isFinite(time) ? time : previousTime;

    return groupStart;
  }

  for (const message of messages) {
    if (message.message_type === 'system') {
      place(message.created_at, null);
      ascending.push({ kind: 'system', key: `m-${message.id}`, message });
      continue;
    }

    const own = isOwnChatMessage(message, currentUserId);
    const sender = own ? 'me' : `u-${message.sender_detail?.id ?? message.sender ?? 'unknown'}`;
    const groupStart = place(message.created_at, sender);

    ascending.push({ kind: 'message', key: `m-${message.id}`, message, own, groupStart });
  }

  for (const item of pending) {
    const groupStart = place(item.createdAt, 'me');

    ascending.push({ kind: 'pending', key: `p-${item.localId}`, pending: item, groupStart });
  }

  return ascending.reverse();
}

/**
 * Number of messages from other people newer than `previousNewestId`. Used for the
 * "N new messages" counter while the user is reading older history.
 */
export function countNewIncoming(
  messages: readonly ChatMessage[],
  previousNewestId: number | null,
  currentUserId: Id | null | undefined,
): number {
  if (previousNewestId === null) {
    return 0;
  }

  return messages.filter(
    (message) =>
      message.id > previousNewestId &&
      message.message_type !== 'system' &&
      !isOwnChatMessage(message, currentUserId),
  ).length;
}

export type DayLabelStrings = { today: string; yesterday: string };

/** Today / yesterday / a full localised date. `format` is injected so this stays pure. */
export function getDayLabel(
  value: string,
  now: Date,
  strings: DayLabelStrings,
  format: (date: Date) => string,
): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((startOf(now) - startOf(date)) / 86_400_000);

  if (diffDays === 0) return strings.today;
  if (diffDays === 1) return strings.yesterday;

  return format(date);
}
