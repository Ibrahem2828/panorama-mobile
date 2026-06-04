export type Id = string | number;

export type ChatMessageSender = {
  id?: Id;
  full_name?: string;
  username?: string | null;
  email?: string;
  role?: string;
  [key: string]: unknown;
};

export type ChatMessage = {
  id: Id;
  group?: Id | Record<string, unknown> | null;
  sender?: Id | ChatMessageSender | null;
  sender_name?: string | null;
  message?: string;
  body?: string;
  content?: string;
  text?: string;
  is_own?: boolean;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
};

export type SendChatMessageInput = {
  message: string;
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
