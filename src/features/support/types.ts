export type Id = string | number;

export type SupportTicketStatus =
  | 'open'
  | 'pending'
  | 'in_progress'
  | 'answered'
  | 'resolved'
  | 'closed'
  | 'rejected'
  | string;

export type SupportTicketPriority = 'low' | 'medium' | 'high' | 'urgent' | string;

export type SupportTicketCategory =
  | 'technical'
  | 'account'
  | 'verification'
  | 'printing'
  | 'files'
  | 'groups'
  | 'other'
  | string;

export type SupportTicketMessage = {
  id?: Id;
  message?: string;
  body?: string;
  content?: string;
  sender?: Id | Record<string, unknown> | null;
  sender_name?: string | null;
  is_staff_reply?: boolean;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
};

export type SupportTicket = {
  id: Id;
  category?: SupportTicketCategory;
  subject?: string;
  title?: string;
  message?: string;
  status?: SupportTicketStatus;
  priority?: SupportTicketPriority;
  messages?: SupportTicketMessage[];
  created_at?: string;
  updated_at?: string;
  closed_at?: string | null;
  resolved_at?: string | null;
  [key: string]: unknown;
};

export type CreateSupportTicketInput = {
  category: SupportTicketCategory;
  subject: string;
  message: string;
};

export type AddSupportTicketMessageInput = {
  message: string;
};

export type SupportTicketDraft = {
  category: SupportTicketCategory;
  subject: string;
  message: string;
};

export type SupportTicketDraftValidation = {
  category?: string;
  subject?: string;
  message?: string;
  replyMessage?: string;
};
