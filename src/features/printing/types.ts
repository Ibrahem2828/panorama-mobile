import type { StatusVariant } from '../../types/common';

export type Id = string | number;
export type PrintColorMode = 'black_white' | 'color';
export type PrintPaperSize = 'a4' | 'a3' | 'a5';
export type PrintSides = 'single' | 'double';
export type PrintBinding = 'none' | 'staple' | 'spiral' | 'thermal';

export type PrintOrderStatus =
  | 'submitted'
  | 'under_review'
  | 'accepted'
  | 'printing'
  | 'ready'
  | 'delivered'
  | 'cancelled'
  | 'rejected'
  | string;

export type PrintPickupLocation = {
  id: Id;
  name: string;
  address?: string | null;
  instructions?: string | null;
  is_active?: boolean;
  sort_order?: number;
};

export type PrintOrderItem = {
  id?: Id;
  source_file?: Id | Record<string, unknown> | null;
  source_file_title?: string | null;
  copies: number;
  pages_count?: number | null;
  sheets_count?: number | null;
  color_mode?: PrintColorMode;
  paper_size?: PrintPaperSize;
  sides?: PrintSides;
  binding?: PrintBinding;
  price?: string | number | null;
  created_at?: string;
  [key: string]: unknown;
};

export type PrintOrder = {
  id: Id;
  status: PrintOrderStatus;
  items: PrintOrderItem[];
  user_notes?: string | null;
  rejected_reason?: string | null;
  total_price?: string | number | null;
  currency?: string | null;
  pickup_location?: Id | null;
  pickup_location_detail?: PrintPickupLocation | null;
  created_at?: string;
  submitted_at?: string | null;
  updated_at?: string;
  completed_at?: string | null;
  cancelled_at?: string | null;
  priority?: string | null;
  price_calculated_at?: string | null;
  status_history?: Array<{
    id: Id;
    old_status?: string | null;
    new_status: string;
    public_note?: string | null;
    created_at: string;
  }>;
  [key: string]: unknown;
};

export type PrintDraft = {
  sourceFileId: Id | null;
  sourceFileTitle: string | null;
  copies: number;
  colorMode: PrintColorMode;
  paperSize: PrintPaperSize;
  sides: PrintSides;
  binding: PrintBinding;
  pickupLocationId: Id | null;
  userNotes: string;
};

export type PrintDraftValidation = { sourceFileId?: string; copies?: string };

export type PrintQuoteItem = {
  pages_count: number;
  sheets_count: number;
  unit_price: string | number;
  binding_price: string | number;
  subtotal: string | number;
  currency: string;
};

export type PrintQuote = {
  total_price: string | number;
  currency: string;
  calculated_at: string;
  items: PrintQuoteItem[];
};

export type PrintStatusPresentation = {
  label: string;
  actionMessage: string;
  variant: StatusVariant;
};
