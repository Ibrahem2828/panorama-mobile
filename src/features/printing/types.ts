import type { StatusVariant } from '../../types/common';

export type Id = string | number;

export type PrintOrderStatus =
  | 'submitted'
  | 'pending'
  | 'accepted'
  | 'in_progress'
  | 'printing'
  | 'ready'
  | 'ready_for_pickup'
  | 'delivered'
  | 'cancelled'
  | 'canceled'
  | 'rejected'
  | string;

export type PrintOrderItem = {
  id?: Id;
  source_file?: Id | Record<string, unknown> | null;
  copies: number;
  pages_count?: number | null;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
};

export type PrintOrder = {
  id: Id;
  status: PrintOrderStatus;
  items: PrintOrderItem[];
  user_notes?: string | null;
  internal_notes?: string | null;
  rejection_reason?: string | null;
  total_price?: string | number | null;
  totalPrice?: string | number | null;
  created_at?: string;
  updated_at?: string;
  submitted_at?: string;
  ready_at?: string | null;
  delivered_at?: string | null;
  [key: string]: unknown;
};

export type PrintDraft = {
  sourceFileId: Id | null;
  sourceFileTitle: string | null;
  copies: number;
  userNotes: string;
};

export type PrintDraftValidation = {
  sourceFileId?: string;
  copies?: string;
};

export type PrintStatusPresentation = {
  label: string;
  variant: StatusVariant;
};
