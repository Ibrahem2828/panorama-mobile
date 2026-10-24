export type Id = string | number;

/** Backend `MessageCreateSerializer.content` max_length. */
export const MAX_MESSAGE_LENGTH = 4000;

/** Same policy as the backend document upload validator (and the web app): 25 MB. */
export const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024;

export type ChatMessageSender = {
  id: number;
  /** For staff this is their position (e.g. «بانوراما أدمن»), never their name. */
  full_name: string;
  /** True when `full_name` is a staff position title. */
  is_staff: boolean;
};

/** The six reactions the server accepts (one per member per message). */
export const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'] as const;

export type ChatReactionCount = { emoji: string; count: number };

/** Ticks of the member's own message: one grey tick = sent, two grey = delivered, two blue = read. */
export type DeliveryState = 'sent' | 'delivered' | 'read';

export type ChatDelivery = {
  state: DeliveryState;
  delivered_count: number;
  read_count: number;
  recipients: number;
};

export type ChatReceiptFrame = { user_id: number; delivered_up_to: number; read_up_to: number };

export type ChatReactionFrame = {
  message_id: number;
  user_id: number;
  emoji: string | null;
  counts: Record<string, number>;
};

export type ChatAttachmentMeta = { name: string; size: number | null };

export type ChatReplyDetail = {
  id: number;
  is_deleted: boolean;
  sender_name?: string;
  preview?: string;
};

export type ChatMessageType = 'text' | 'image' | 'file' | 'system';

/** A server-confirmed message. Identity is the numeric server id. */
export type ChatMessage = {
  id: number;
  group: number | null;
  sender: number | null;
  sender_detail: ChatMessageSender | null;
  content: string;
  message_type: ChatMessageType;
  has_attachment: boolean;
  attachment_meta: ChatAttachmentMeta | null;
  reply_to: number | null;
  reply_to_detail: ChatReplyDetail | null;
  reactions: ChatReactionCount[];
  my_reaction: string | null;
  /** Only present on the viewer's own messages. */
  delivery: ChatDelivery | null;
  created_at: string;
};

export type ChatAttachment = {
  uri: string;
  name: string;
  mimeType: string;
  size: number;
  /** `image` is sent as a photo message, `file` as a document message. */
  kind: 'image' | 'file';
};

export type PendingStatus = 'sending' | 'failed';

/** A message the user sent that the server has not confirmed yet (optimistic bubble). */
export type PendingMessage = {
  localId: string;
  /** Sent as `Idempotency-Key`; reused on retry so a delivered message is not posted twice. */
  idempotencyKey: string;
  content: string;
  attachment: ChatAttachment | null;
  status: PendingStatus;
  createdAt: string;
  /** Upload progress in [0, 1] while an attachment is being sent. */
  progress: number;
  error: string | null;
  /**
   * True when the server answered with a definitive rejection (4xx). The key may now be
   * cached against that answer, so the next attempt must use a fresh one.
   */
  keyBurned: boolean;
};

export type ChatConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'reconnecting'
  | 'error';

export type ChatSendPermission =
  | 'allowed'
  | 'members_only'
  | 'admins_only'
  | 'not_member'
  | 'blocked'
  | 'unknown';

/** One row of the (inverted) message list. */
export type ChatListItem =
  | { kind: 'day'; key: string; date: string }
  | { kind: 'system'; key: string; message: ChatMessage }
  | {
      kind: 'message';
      key: string;
      message: ChatMessage;
      own: boolean;
      /** Ticks of the member's own message (null for other people's). */
      delivery: DeliveryState | null;
      /** First message of a run by the same sender: shows name/avatar and extra spacing. */
      groupStart: boolean;
    }
  | {
      kind: 'pending';
      key: string;
      pending: PendingMessage;
      groupStart: boolean;
    };
