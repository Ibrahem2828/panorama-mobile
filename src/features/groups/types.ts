export type Id = string | number;

export type GroupMembershipStatus =
  | 'none'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'blocked'
  | 'left'
  | string;

export type GroupRole = 'member' | 'moderator' | 'group_admin' | 'admin' | 'it_support' | string;

export type SendMessagesPermission = 'all_members' | 'admins_only' | string;

export type Group = {
  id: Id;
  name?: string;
  title?: string;
  description?: string | null;
  image?: string | null;
  image_url?: string | null;
  members_count?: number;
  current_user_membership_status?: GroupMembershipStatus;
  current_user_group_role?: GroupRole | null;
  send_messages_permission?: SendMessagesPermission;
  has_whatsapp_channel?: boolean;
  university?: Id | Record<string, unknown> | null;
  major?: Id | Record<string, unknown> | null;
  academic_year?: Id | Record<string, unknown> | null;
  semester?: Id | Record<string, unknown> | null;
  subject?: Id | Record<string, unknown> | null;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
};

export type GroupListType = 'available' | 'my';

export type GroupJoinResult = {
  status?: GroupMembershipStatus;
  group?: Group;
  [key: string]: unknown;
};

export type WhatsAppAccessTicket = { open_url: string; expires_at: string };
