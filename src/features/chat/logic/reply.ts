import type { ChatListItem, ChatMessage, ChatReplyTarget, PendingMessage } from '../types';

/** The server previews a quoted message at 80 characters; the composer bar uses the same limit. */
export const REPLY_PREVIEW_MAX = 80;

type ReplyLabels = { unnamedSender: string; image: string; file: string };

function collapse(text: string): string {
  return text.split(/\s+/).filter(Boolean).join(' ');
}

function truncate(text: string): string {
  return text.length > REPLY_PREVIEW_MAX ? `${text.slice(0, REPLY_PREVIEW_MAX)}...` : text;
}

/** System messages and messages without a server id cannot be replied to. */
export function canReplyToMessage(message: ChatMessage): boolean {
  return message.message_type !== 'system' && Number.isFinite(message.id);
}

/** What the composer bar and the optimistic bubble show about the message being answered. */
export function replyTargetFromMessage(message: ChatMessage, labels: ReplyLabels): ChatReplyTarget {
  const text = collapse(message.content);
  const preview =
    text !== ''
      ? truncate(text)
      : message.message_type === 'image'
        ? labels.image
        : message.has_attachment
          ? labels.file
          : '';

  return {
    id: message.id,
    senderName: message.sender_detail?.full_name?.trim() || labels.unnamedSender,
    preview,
  };
}

export type QuotedReply = {
  id: number;
  deleted: boolean;
  senderName: string;
  preview: string;
};

/** The quote shown inside a confirmed bubble, read from the server's `reply_to_detail`. Null when it does not reply. */
export function quotedFromMessage(message: ChatMessage, labels: ReplyLabels): QuotedReply | null {
  const id = message.reply_to_detail?.id ?? message.reply_to;

  if (id === null || id === undefined) return null;

  const detail = message.reply_to_detail;

  if (!detail || detail.is_deleted) {
    return { id, deleted: true, senderName: '', preview: '' };
  }

  return {
    id,
    deleted: false,
    senderName: detail.sender_name?.trim() || labels.unnamedSender,
    preview: detail.preview ? truncate(collapse(detail.preview)) : '',
  };
}

/** The quote shown inside a not-yet-confirmed bubble. */
export function quotedFromPending(pending: PendingMessage): QuotedReply | null {
  return pending.replyTo
    ? {
        id: pending.replyTo.id,
        deleted: false,
        senderName: pending.replyTo.senderName,
        preview: pending.replyTo.preview,
      }
    : null;
}

/** Index of the list row holding message `id`, or -1 when it is not loaded (older history, or deleted). */
export function findMessageItemIndex(items: readonly ChatListItem[], id: number): number {
  return items.findIndex((item) => item.kind === 'message' && item.message.id === id);
}

/** A pending reply is dropped when its target disappears (deleted by its author or a moderator) before sending. */
export function isReplyTargetAvailable(
  messages: readonly ChatMessage[],
  target: ChatReplyTarget | null,
): boolean {
  return target === null || messages.some((message) => message.id === target.id);
}

/** How far a horizontal drag has to travel to count as "swipe to reply". */
export const SWIPE_REPLY_DISTANCE = 56;

/** A deliberate horizontal drag, so vertical list scrolling is never hijacked. */
export function isHorizontalSwipe(dx: number, dy: number): boolean {
  return Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy) * 2;
}

export function shouldTriggerReply(dx: number): boolean {
  return Math.abs(dx) >= SWIPE_REPLY_DISTANCE;
}
