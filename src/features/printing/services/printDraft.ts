import {
  MAX_UPLOAD_BYTES,
  UPLOAD_EXTENSIONS,
  UPLOAD_MIME_TYPES,
  appendLocalFile,
  fileExtension,
  mimeTypeOf,
  toLocalFile,
  validateUploadCandidate,
} from '../../attachments/services/localFile';
import { parsePageRange } from './printOptions';
import type {
  PrintCartItem,
  PrintCurrency,
  PrintDraft,
  PrintDraftValidation,
  PrintItemValidation,
  PrintLocalFile,
  PrintSource,
} from '../types';

/** Backend `PrintOrderItemInputSerializer.copies` max_value. */
export const MAX_COPIES = 99;
/** Backend limit: "A single order cannot contain more than 10 items." */
export const MAX_PRINT_ITEMS = 10;
export {
  MAX_UPLOAD_BYTES,
  UPLOAD_EXTENSIONS,
  UPLOAD_MIME_TYPES,
  fileExtension,
  mimeTypeOf,
  toLocalFile,
  validateUploadCandidate,
};

/** One request's total multipart budget (backend body cap with envelope slack). */
export const MAX_REQUEST_UPLOAD_BYTES = 48 * 1024 * 1024;

export const DEFAULT_ITEM_OPTIONS = {
  copies: 1,
  colorMode: 'black_white',
  paperSize: 'A4',
  sides: 'one_sided',
  binding: 'none',
  cover: '',
  pagesPerSheet: 1,
  nUpDirection: 'ltr',
  duplexFlip: 'long_edge',
  orientation: 'auto',
  pageRange: '',
  collate: true,
} as const satisfies Omit<PrintCartItem, 'key' | 'source'>;

let itemCounter = 0;

export function newCartItem(source: PrintSource = null): PrintCartItem {
  itemCounter += 1;

  return { key: `item-${Date.now().toString(36)}-${itemCounter}`, source, ...DEFAULT_ITEM_OPTIONS };
}

export const DEFAULT_PRINT_CURRENCY: PrintCurrency = 'SYP';

export function createEmptyDraft(currency: PrintCurrency = DEFAULT_PRINT_CURRENCY): PrintDraft {
  return { items: [newCartItem()], pickupLocationId: null, userNotes: '', currency };
}

export function validateItem(item: PrintCartItem): PrintItemValidation {
  const out: PrintItemValidation = {};

  if (!item.source) {
    out.source = true;
  }

  if (!Number.isInteger(item.copies) || item.copies < 1 || item.copies > MAX_COPIES) {
    out.copies = true;
  }

  // Only the writing of the range is checked here; whether the pages exist is the server's answer to the quote.
  if (item.source?.kind !== 'product' && !parsePageRange(item.pageRange, null).ok) {
    out.pageRange = true;
  }

  return out;
}

export function uploadedFiles(draft: PrintDraft): PrintLocalFile[] {
  return draft.items.flatMap((item) => (item.source?.kind === 'upload' ? [item.source.file] : []));
}

export function uploadBytes(draft: PrintDraft): number {
  return uploadedFiles(draft).reduce((sum, file) => sum + (file.size ?? 0), 0);
}

export function exceedsRequestBudget(draft: PrintDraft): boolean {
  return uploadBytes(draft) > MAX_REQUEST_UPLOAD_BYTES;
}

export function validateDraft(draft: PrintDraft): PrintDraftValidation {
  const items = draft.items.map(validateItem);
  const count = draft.items.length < 1 || draft.items.length > MAX_PRINT_ITEMS ? true : undefined;
  const uploadsTooLarge = exceedsRequestBudget(draft) ? true : undefined;
  const valid =
    !count && !uploadsTooLarge && items.every((entry) => !entry.source && !entry.copies);

  return { items, count, uploadsTooLarge, valid };
}

export function totalCopies(draft: PrintDraft): number {
  return draft.items.reduce((sum, item) => sum + item.copies, 0);
}

/** The print-dialog options of a file item. A ready-made product sends only itself and the copies. */
function itemFields(item: PrintCartItem): Record<string, string | number | boolean> {
  if (item.source?.kind === 'product') {
    return { product: item.source.product.id, copies: item.copies };
  }

  return {
    copies: item.copies,
    color_mode: item.colorMode,
    paper_size: item.paperSize,
    sides: item.sides,
    binding: item.binding,
    pages_per_sheet: item.pagesPerSheet,
    n_up_direction: item.nUpDirection,
    duplex_flip: item.duplexFlip,
    orientation: item.orientation,
    collate: item.collate,
    ...(item.cover ? { cover: item.cover } : {}),
    ...(item.pageRange.trim() ? { page_range: item.pageRange.trim() } : {}),
  };
}

type JsonItem = Record<string, string | number | boolean> &
  ({ source_file: number | string } | { converted_upload: string } | { product: number });

export type PrintQuoteJson = { items: JsonItem[]; currency: PrintCurrency };
export type PrintOrderJson = PrintQuoteJson & {
  user_notes?: string;
  pickup_location: number | string | null;
};

/**
 * JSON when every item is a library file; multipart (`items[i]field`, the DRF html-list
 * naming the backend parses) as soon as one item is an upload. The client never sends a
 * price.
 */
export function buildQuoteBody(draft: PrintDraft): PrintQuoteJson | FormData {
  if (draft.items.length === 0 || draft.items.some((item) => !item.source)) {
    throw new Error('missing source');
  }

  if (
    draft.items.every(
      (item) =>
        item.source?.kind === 'library' ||
        item.source?.kind === 'converted' ||
        item.source?.kind === 'product',
    )
  ) {
    return {
      currency: draft.currency,
      items: draft.items.map((item) => {
        const { source } = item;

        if (source?.kind === 'product') {
          return itemFields(item) as JsonItem;
        }

        return (
          source?.kind === 'converted'
            ? { converted_upload: source.id, ...itemFields(item) }
            : { source_file: (source as { id: number | string }).id, ...itemFields(item) }
        ) as JsonItem;
      }),
    };
  }

  const form = new FormData();

  form.append('currency', draft.currency);

  draft.items.forEach((item, index) => {
    const { source } = item;

    if (source?.kind === 'upload') {
      appendLocalFile(form, `items[${index}]uploaded_file`, source.file);
    } else if (source?.kind === 'library') {
      form.append(`items[${index}]source_file`, String(source.id));
    } else if (source?.kind === 'converted') {
      form.append(`items[${index}]converted_upload`, source.id);
    }
    // (a product item has no file part: its own `product` field is in itemFields)

    Object.entries(itemFields(item)).forEach(([key, value]) => {
      form.append(`items[${index}]${key}`, String(value));
    });
  });

  return form;
}

export function buildOrderBody(draft: PrintDraft): PrintOrderJson | FormData {
  const body = buildQuoteBody(draft);
  const notes = draft.userNotes.trim();

  if (body instanceof FormData) {
    if (notes) {
      body.append('user_notes', notes);
    }

    if (draft.pickupLocationId !== null) {
      body.append('pickup_location', String(draft.pickupLocationId));
    }

    return body;
  }

  return { ...body, user_notes: notes || undefined, pickup_location: draft.pickupLocationId };
}

function sourceSignature(source: PrintSource): string {
  if (!source) {
    return '-';
  }

  if (source.kind === 'library') {
    return `lib:${source.id}`;
  }

  if (source.kind === 'product') {
    return `pr:${source.product.id}`;
  }

  return source.kind === 'converted'
    ? `cv:${source.id}`
    : `up:${source.file.uri}:${source.file.size ?? 0}`;
}

/** Stable signature of everything that affects a quote, so a stale quote is detected. */
export function draftSignature(draft: PrintDraft): string {
  return JSON.stringify([
    draft.currency,
    draft.items.map((item) => [
      sourceSignature(item.source),
      item.copies,
      item.colorMode,
      item.paperSize,
      item.sides,
      item.binding,
      item.cover,
      item.pagesPerSheet,
      item.nUpDirection,
      item.duplexFlip,
      item.orientation,
      item.pageRange.trim(),
      item.collate,
    ]),
  ]);
}

/** What an order idempotency key is scoped to: the quote signature plus order-level fields. */
export function orderSignature(draft: PrintDraft): string {
  return `${draftSignature(draft)}|${draft.pickupLocationId}|${draft.userNotes.trim()}`;
}

export function sourceName(source: PrintSource): string | null {
  if (!source) {
    return null;
  }

  if (source.kind === 'library') {
    return source.title;
  }

  if (source.kind === 'product') {
    return source.product.name;
  }

  return source.kind === 'converted' ? source.name : source.file.name;
}

/** Whether a request body carries a local file that has to be uploaded. */
export function hasUploads(draft: PrintDraft): boolean {
  return uploadedFiles(draft).length > 0;
}

export function uploadPercent(loaded: number, total: number): number {
  if (!Number.isFinite(loaded) || !Number.isFinite(total) || total <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round((loaded / total) * 100)));
}
