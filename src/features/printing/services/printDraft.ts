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
import type {
  PrintCartItem,
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
} as const satisfies Omit<PrintCartItem, 'key' | 'source'>;

let itemCounter = 0;

export function newCartItem(source: PrintSource = null): PrintCartItem {
  itemCounter += 1;

  return { key: `item-${Date.now().toString(36)}-${itemCounter}`, source, ...DEFAULT_ITEM_OPTIONS };
}

export function createEmptyDraft(): PrintDraft {
  return { items: [newCartItem()], pickupLocationId: null, userNotes: '' };
}

export function validateItem(item: PrintCartItem): PrintItemValidation {
  const out: PrintItemValidation = {};

  if (!item.source) {
    out.source = true;
  }

  if (!Number.isInteger(item.copies) || item.copies < 1 || item.copies > MAX_COPIES) {
    out.copies = true;
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

function itemFields(item: PrintCartItem) {
  return {
    copies: item.copies,
    color_mode: item.colorMode,
    paper_size: item.paperSize,
    sides: item.sides,
    binding: item.binding,
  };
}

type JsonItem = ReturnType<typeof itemFields> & { source_file: number | string };

export type PrintQuoteJson = { items: JsonItem[] };
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

  if (draft.items.every((item) => item.source?.kind === 'library')) {
    return {
      items: draft.items.map((item) => ({
        source_file: (item.source as { id: number | string }).id,
        ...itemFields(item),
      })),
    };
  }

  const form = new FormData();

  draft.items.forEach((item, index) => {
    const { source } = item;

    if (source?.kind === 'upload') {
      appendLocalFile(form, `items[${index}]uploaded_file`, source.file);
    } else if (source?.kind === 'library') {
      form.append(`items[${index}]source_file`, String(source.id));
    }

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

  return source.kind === 'library'
    ? `lib:${source.id}`
    : `up:${source.file.uri}:${source.file.size ?? 0}`;
}

/** Stable signature of everything that affects a quote, so a stale quote is detected. */
export function draftSignature(draft: PrintDraft): string {
  return JSON.stringify(
    draft.items.map((item) => [
      sourceSignature(item.source),
      item.copies,
      item.colorMode,
      item.paperSize,
      item.sides,
      item.binding,
    ]),
  );
}

/** What an order idempotency key is scoped to: the quote signature plus order-level fields. */
export function orderSignature(draft: PrintDraft): string {
  return `${draftSignature(draft)}|${draft.pickupLocationId}|${draft.userNotes.trim()}`;
}

export function sourceName(source: PrintSource): string | null {
  if (!source) {
    return null;
  }

  return source.kind === 'library' ? source.title : source.file.name;
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
