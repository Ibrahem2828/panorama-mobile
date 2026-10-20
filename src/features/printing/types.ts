import type { StatusVariant } from '../../types/common';
import type { LocalFile, UploadProblem } from '../attachments/services/localFile';

export type Id = string | number;
export type PrintColorMode = 'black_white' | 'color';
// Wire values match the backend's PaperSizeEnum / SidesEnum exactly (see contracts/openapi.json).
export type PrintPaperSize = 'A4' | 'A3' | 'A5';
export type PrintSides = 'one_sided' | 'double_sided';
export type PrintBinding = 'none' | 'staple' | 'spiral' | 'thermal';

/** Wire values match the backend's currency enum (SYP is the new Syrian pound). */
export type PrintCurrency = 'SYP' | 'USD';

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
  has_uploaded_file?: boolean;
  original_file_name?: string | null;
  file_type?: string | null;
  file_size?: number | null;
  copies: number;
  pages_count?: number | null;
  sheets_count?: number | null;
  color_mode?: PrintColorMode;
  paper_size?: PrintPaperSize;
  sides?: PrintSides;
  binding?: PrintBinding;
  unit_price?: string | number | null;
  binding_price?: string | number | null;
  price?: string | number | null;
  created_at?: string;
  [key: string]: unknown;
};

export type PrintStatusHistoryEntry = {
  id: Id;
  old_status?: string | null;
  new_status: string;
  public_note?: string | null;
  created_at: string;
};

export type PrintOrder = {
  id: Id;
  status: PrintOrderStatus;
  items: PrintOrderItem[];
  user_notes?: string | null;
  rejected_reason?: string | null;
  total_price?: string | number | null;
  /** Signed amount the total was rounded by (new Syrian pound totals are rounded to tens); 0 when it was not. */
  rounding_adjustment?: string | number | null;
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
  status_history?: PrintStatusHistoryEntry[];
  [key: string]: unknown;
};

/** A file picked on the device (image library) and not yet uploaded. */
export type PrintLocalFile = LocalFile;

/** Where one item's file comes from: an existing library file, or a local upload. */
export type PrintSource =
  | { kind: 'library'; id: Id; title: string }
  | { kind: 'upload'; file: PrintLocalFile }
  /** A Word/PowerPoint file the server already converted to PDF; `id` is the conversion reference. */
  | { kind: 'converted'; id: string; name: string; pages: number | null }
  | null;

/** One file of the order with its own print options. `key` is a local identity only. */
export type PrintCartItem = {
  key: string;
  source: PrintSource;
  copies: number;
  colorMode: PrintColorMode;
  paperSize: PrintPaperSize;
  sides: PrintSides;
  binding: PrintBinding;
};

export type PrintDraft = {
  items: PrintCartItem[];
  pickupLocationId: Id | null;
  userNotes: string;
  currency: PrintCurrency;
};

export type PrintItemValidation = { source?: boolean; copies?: boolean };

export type PrintDraftValidation = {
  /** Index-aligned with `draft.items`. */
  items: PrintItemValidation[];
  /** No items, or more than the backend allows. */
  count?: boolean;
  /** The summed size of the uploads exceeds what one request may carry. */
  uploadsTooLarge?: boolean;
  valid: boolean;
};

export type { UploadProblem };

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
  /** The total by the price list before rounding, and how much the rounding moved it. */
  exact_total?: string | number | null;
  rounding_adjustment?: string | number | null;
  currency: string;
  calculated_at?: string;
  items: PrintQuoteItem[];
};

/** A quote together with what it was computed for, so a stale one is never submitted. */
export type PrintQuoteState = {
  value: PrintQuote;
  signature: string;
  /** File names at quote time, index-aligned with `value.items`. */
  names: string[];
};

export type PrintTransferPhase = 'quote' | 'order';

export type PrintTransferState = {
  phase: PrintTransferPhase;
  loaded: number;
  total: number;
};

export type PrintStatusPresentation = {
  label: string;
  actionMessage: string;
  variant: StatusVariant;
};

export type PrintProgressStepState = 'done' | 'current' | 'todo';

export type PrintProgressStep = { status: PrintOrderStatus; state: PrintProgressStepState };

export type PrintOrderProgress = {
  steps: PrintProgressStep[];
  /** Set when the order ended without being delivered. */
  terminal: 'cancelled' | 'rejected' | null;
};
