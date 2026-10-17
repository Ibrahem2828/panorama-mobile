export type Id = string | number;

/** Backend `MessageCreateSerializer.content` max_length. */
export const MAX_MESSAGE_LENGTH = 4000;

/** Same policy as the backend document upload validator (and the web app): 25 MB. */
export const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024;

export type ChatMessageSender = {
  id: number;
  full_name: string;
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
  reply_to: number | null;
  created_at: string;
};

export type ChatAttachment = {
  uri: string;
  name: string;
  mimeType: string;
  size: number;
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
      /** First message of a run by the same sender: shows name/avatar and extra spacing. */
      groupStart: boolean;
    }
  | {
      kind: 'pending';
      key: string;
      pending: PendingMessage;
      groupStart: boolean;
    };
