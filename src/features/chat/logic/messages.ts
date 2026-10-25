import type {
  ChatDelivery,
  ChatMessage,
  ChatMessageSender,
  ChatMessageType,
  ChatReactionCount,
  ChatReplyDetail,
  ChatReactionFrame,
  ChatReceiptFrame,
  DeliveryState,
  Id,
} from '../types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toText(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }

  if (typeof value === 'number') {
    return String(value);
  }

  return undefined;
}

/** Ids arrive as numbers over REST and may arrive as numeric strings elsewhere. */
export function toNumericId(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && /^\d+$/u.test(value)) {
    return Number(value);
  }

  return null;
}

const MESSAGE_TYPES = new Set<string>(['text', 'image', 'file', 'system']);

function toMessageType(value: unknown): ChatMessageType {
  return typeof value === 'string' && MESSAGE_TYPES.has(value)
    ? (value as ChatMessageType)
    : 'text';
}

const DELIVERY_STATES = new Set<string>(['sent', 'delivered', 'read']);

function toDelivery(value: unknown): ChatDelivery | null {
  if (!isRecord(value) || typeof value.state !== 'string' || !DELIVERY_STATES.has(value.state)) {
    return null;
  }

  return {
    state: value.state as DeliveryState,
    delivered_count: toNumericId(value.delivered_count) ?? 0,
    read_count: toNumericId(value.read_count) ?? 0,
    recipients: toNumericId(value.recipients) ?? 0,
  };
}

function toReactions(value: unknown): ChatReactionCount[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry) => {
    const count = isRecord(entry) ? toNumericId(entry.count) : null;

    return isRecord(entry) && typeof entry.emoji === 'string' && count !== null && count > 0
      ? [{ emoji: entry.emoji, count }]
      : [];
  });
}

function toReplyDetail(value: unknown): ChatReplyDetail | null {
  const id = isRecord(value) ? toNumericId(value.id) : null;

  if (!isRecord(value) || id === null) {
    return null;
  }

  return {
    id,
    is_deleted: value.is_deleted === true,
    sender_name: toText(value.sender_name),
    preview: toText(value.preview),
  };
}

/**
 * Accepts a REST message or a socket payload (`{data}` / `{message}` envelope or the bare
 * object). Returns null when it has no server id (it could never be de-duplicated), when it
 * was deleted, or when it carries neither text nor an attachment.
 */
export function normalizeChatMessage(
  payload: unknown,
  fallbackGroupId?: Id | null,
): ChatMessage | null {
  if (!isRecord(payload)) {
    return null;
  }

  const candidate = isRecord(payload.data)
    ? payload.data
    : isRecord(payload.message)
      ? payload.message
      : payload;
  const id = toNumericId(candidate.id);

  if (id === null || candidate.is_deleted === true) {
    return null;
  }

  const detail = isRecord(candidate.sender_detail)
    ? candidate.sender_detail
    : isRecord(candidate.sender)
      ? candidate.sender
      : null;
  const senderId = toNumericId(detail?.id) ?? toNumericId(candidate.sender);
  const content =
    typeof candidate.content === 'string'
      ? candidate.content
      : (toText(candidate.message) ?? toText(candidate.body) ?? toText(candidate.text) ?? '');
  const hasAttachment = candidate.has_attachment === true;

  if (content.trim().length === 0 && !hasAttachment) {
    return null;
  }

  const sender: ChatMessageSender | null =
    senderId === null
      ? null
      : {
          id: senderId,
          full_name: toText(detail?.full_name) ?? toText(candidate.sender_name) ?? '',
          is_staff: detail?.is_staff === true,
        };
  const meta = isRecord(candidate.attachment_meta) ? candidate.attachment_meta : null;

  return {
    id,
    group: toNumericId(candidate.group) ?? toNumericId(fallbackGroupId),
    sender: senderId,
    sender_detail: sender,
    content,
    message_type: toMessageType(candidate.message_type),
    has_attachment: hasAttachment,
    attachment_meta: meta ? { name: toText(meta.name) ?? '', size: toNumericId(meta.size) } : null,
    reply_to: toNumericId(candidate.reply_to),
    reply_to_detail: toReplyDetail(candidate.reply_to_detail),
    reactions: toReactions(candidate.reactions),
    my_reaction: typeof candidate.my_reaction === 'string' ? candidate.my_reaction : null,
    delivery: toDelivery(candidate.delivery),
    created_at: toText(candidate.created_at) ?? new Date().toISOString(),
  };
}

function timeOf(message: ChatMessage): number {
  const time = new Date(message.created_at).getTime();

  return Number.isNaN(time) ? 0 : time;
}

/** Oldest first; the server id breaks ties so the order is stable. */
export function compareMessages(left: ChatMessage, right: ChatMessage): number {
  const byTime = timeOf(left) - timeOf(right);

  return byTime !== 0 ? byTime : left.id - right.id;
}

/** Union by server id (incoming wins), oldest first. Used for REST pages and socket pushes. */
export function mergeChatMessages(
  current: readonly ChatMessage[],
  incoming: readonly ChatMessage[],
  deletedIds?: ReadonlySet<number>,
): ChatMessage[] {
  const byId = new Map<number, ChatMessage>();

  for (const message of current) {
    byId.set(message.id, message);
  }

  for (const message of incoming) {
    byId.set(message.id, message);
  }

  const merged = Array.from(byId.values());
  const visible =
    deletedIds && deletedIds.size > 0
      ? merged.filter((message) => !deletedIds.has(message.id))
      : merged;

  return visible.sort(compareMessages);
}

export function removeChatMessageById(
  current: readonly ChatMessage[],
  messageId: number,
): readonly ChatMessage[] {
  return current.some((message) => message.id === messageId)
    ? current.filter((message) => message.id !== messageId)
    : current;
}

/** Id of a `message.deleted` frame (`{id, group_id}`); null when malformed. */
export function parseDeletedFrame(payload: unknown): number | null {
  if (!isRecord(payload)) {
    return null;
  }

  const candidate = isRecord(payload.data) ? payload.data : payload;

  return toNumericId(candidate.id);
}

/**
 * After re-reading the newest page: drops locally known messages inside that page's id
 * range that the server no longer returns (deleted on another device).
 */
export function pruneMissingMessages(
  current: readonly ChatMessage[],
  freshNewestPage: readonly ChatMessage[],
  pageIsComplete: boolean,
): readonly ChatMessage[] {
  if (freshNewestPage.length === 0) {
    return pageIsComplete ? [] : current;
  }

  const floor = Math.min(...freshNewestPage.map((message) => message.id));
  const present = new Set(freshNewestPage.map((message) => message.id));

  return current.filter((message) => message.id < floor || present.has(message.id));
}

export function isOwnChatMessage(message: ChatMessage, currentUserId?: Id | null): boolean {
  if (currentUserId === null || currentUserId === undefined) {
    return false;
  }

  const senderId = message.sender_detail?.id ?? message.sender;

  return senderId !== null && senderId !== undefined && String(senderId) === String(currentUserId);
}

export function getChatSenderName(message: ChatMessage, fallback: string): string {
  return toText(message.sender_detail?.full_name) ?? fallback;
}

function frameData(payload: unknown): Record<string, unknown> | null {
  if (!isRecord(payload)) {
    return null;
  }

  return isRecord(payload.data) ? payload.data : payload;
}

/** `{type:'receipt', data:{user_id, delivered_up_to, read_up_to}}`; null when malformed. */
export function parseReceiptFrame(payload: unknown): ChatReceiptFrame | null {
  const data = frameData(payload);
  const userId = toNumericId(data?.user_id);

  if (!data || userId === null) {
    return null;
  }

  return {
    user_id: userId,
    delivered_up_to: toNumericId(data.delivered_up_to) ?? 0,
    read_up_to: toNumericId(data.read_up_to) ?? 0,
  };
}

/** `{type:'reaction', data:{message_id, user_id, emoji, counts}}`; null when malformed. */
export function parseReactionFrame(payload: unknown): ChatReactionFrame | null {
  const data = frameData(payload);
  const messageId = toNumericId(data?.message_id);
  const userId = toNumericId(data?.user_id);

  if (!data || messageId === null || userId === null) {
    return null;
  }

  const counts: Record<string, number> = {};

  if (isRecord(data.counts)) {
    for (const [emoji, count] of Object.entries(data.counts)) {
      const value = toNumericId(count);

      if (value !== null && value > 0) {
        counts[emoji] = value;
      }
    }
  }

  return {
    message_id: messageId,
    user_id: userId,
    emoji: typeof data.emoji === 'string' ? data.emoji : null,
    counts,
  };
}

/** Counts map → the sorted list shown under a bubble (most used first). */
export function reactionList(counts: Record<string, number>): ChatReactionCount[] {
  return Object.entries(counts)
    .map(([emoji, count]) => ({ emoji, count }))
    .sort((left, right) => right.count - left.count);
}

/** Whichever of the server's answer and the live cursors of the other members is further along. */
export function effectiveDeliveryState(
  message: ChatMessage,
  peerCursors: Readonly<Record<number, { delivered: number; read: number }>>,
  currentUserId: Id | null | undefined,
): DeliveryState {
  const server = message.delivery?.state ?? 'sent';

  if (server === 'read') {
    return 'read';
  }

  let state: DeliveryState = server;

  for (const [userId, cursor] of Object.entries(peerCursors)) {
    if (
      currentUserId !== null &&
      currentUserId !== undefined &&
      String(userId) === String(currentUserId)
    ) {
      continue;
    }

    if (cursor.read >= message.id) {
      return 'read';
    }

    if (cursor.delivered >= message.id) {
      state = 'delivered';
    }
  }

  return state;
}
