import {
  normalizeApiError,
  printingService as api,
  type CreatePrintOrderRequest,
  type PaginatedResult,
  type PrintOrder as ApiPrintOrder,
} from '../../../api';
import type { Locale, TranslationCatalog } from '../../../i18n';
import type {
  Id,
  PrintDraft,
  PrintDraftValidation,
  PrintOrder,
  PrintPickupLocation,
  PrintQuote,
  PrintStatusPresentation,
} from '../types';

type PrintingCatalog = TranslationCatalog['printing'];

function normalizeOrder(order: ApiPrintOrder): PrintOrder {
  return {
    ...order,
    id: order.id,
    status: order.status ?? 'submitted',
    items: Array.isArray(order.items)
      ? order.items.map((item) => ({ ...item, copies: Number(item.copies ?? 1) }))
      : [],
  } as PrintOrder;
}

export function getPrintOrderStatusPresentation(
  status: string,
  t: PrintingCatalog,
  unknownLabel: string,
): PrintStatusPresentation {
  const { status: labels } = t;
  switch (status) {
    case 'submitted':
      return {
        label: labels.submitted.label,
        actionMessage: labels.submitted.action,
        variant: 'warning',
      };
    case 'under_review':
      return {
        label: labels.underReview.label,
        actionMessage: labels.underReview.action,
        variant: 'info',
      };
    case 'accepted':
      return {
        label: labels.accepted.label,
        actionMessage: labels.accepted.action,
        variant: 'info',
      };
    case 'printing':
      return {
        label: labels.printing.label,
        actionMessage: labels.printing.action,
        variant: 'brand',
      };
    case 'ready':
      return { label: labels.ready.label, actionMessage: labels.ready.action, variant: 'success' };
    case 'delivered':
      return {
        label: labels.delivered.label,
        actionMessage: labels.delivered.action,
        variant: 'success',
      };
    case 'cancelled':
      return {
        label: labels.cancelled.label,
        actionMessage: labels.cancelled.action,
        variant: 'neutral',
      };
    case 'rejected':
      return {
        label: labels.rejected.label,
        actionMessage: labels.rejected.action,
        variant: 'error',
      };
    default:
      return {
        label: status || unknownLabel,
        actionMessage: labels.unknownAction,
        variant: 'neutral',
      };
  }
}

export function canCancelPrintOrder(order: PrintOrder): boolean {
  return ['submitted', 'under_review', 'accepted'].includes(order.status);
}
export function getPrintOrderDisplayTitle(order: PrintOrder, t: PrintingCatalog) {
  return t.order.fallbackTitle(String(order.id));
}
export function getPrintOrderItemsCount(order: PrintOrder) {
  return order.items.length;
}
export function getPrintOrderCopiesCount(order: PrintOrder) {
  return order.items.reduce((sum, item) => sum + item.copies, 0);
}
export function getPrintOrderItemFileLabel(item: PrintOrder['items'][number], t: PrintingCatalog) {
  return (
    item.source_file_title ||
    (typeof item.source_file === 'object' && item.source_file && 'title' in item.source_file
      ? String(item.source_file.title)
      : t.order.fallbackFileTitle)
  );
}
const DATE_LOCALES: Record<Locale, string> = { ar: 'ar-SY', en: 'en-GB' };

export function formatPrintOrderDate(value: string | null | undefined, locale: Locale) {
  return value ? new Date(value).toLocaleDateString(DATE_LOCALES[locale]) : null;
}
export function formatPrintOrderPrice(order: PrintOrder) {
  if (order.total_price == null) return null;
  return `${order.total_price} ${order.currency ?? 'SYP'}`;
}

export function validatePrintDraft(draft: PrintDraft, t: PrintingCatalog): PrintDraftValidation {
  const validation: PrintDraftValidation = {};
  if (draft.sourceFileId == null) validation.sourceFileId = t.errors.missingFile;
  if (!Number.isInteger(draft.copies) || draft.copies < 1 || draft.copies > 99)
    validation.copies = t.errors.invalidCopies;
  return validation;
}
export function hasPrintDraftValidationErrors(v: PrintDraftValidation) {
  return Boolean(v.sourceFileId || v.copies);
}

export function buildPrintItem(draft: PrintDraft) {
  if (draft.sourceFileId == null) return null;
  return {
    source_file: draft.sourceFileId,
    copies: draft.copies,
    color_mode: draft.colorMode,
    paper_size: draft.paperSize,
    sides: draft.sides,
    binding: draft.binding,
  } as const;
}
export function buildCreatePrintOrderRequest(draft: PrintDraft): CreatePrintOrderRequest | null {
  const item = buildPrintItem(draft);
  if (!item) return null;
  return {
    items: [item],
    user_notes: draft.userNotes.trim() || undefined,
    pickup_location: draft.pickupLocationId,
  };
}

export function toSafePrintingErrorMessage(error: unknown, t: PrintingCatalog): string {
  const normalized = normalizeApiError(error);
  if (normalized.code === 'NETWORK_ERROR' || normalized.code === 'TIMEOUT') return t.errors.network;
  if (normalized.code === 'UNAUTHORIZED') return t.errors.unauthorized;
  if (normalized.code === 'FORBIDDEN') return t.errors.forbidden;
  return normalized.message || t.errors.generic;
}

export async function calculatePrintQuote(
  draft: PrintDraft,
  token: string,
  t: PrintingCatalog,
): Promise<PrintQuote> {
  const item = buildPrintItem(draft);
  if (!item) throw new Error(t.errors.missingFile);
  return api.quotePrintOrder({ items: [item] }, token) as Promise<PrintQuote>;
}
export async function loadPickupLocations(token: string): Promise<PrintPickupLocation[]> {
  return api.listPickupLocations(token) as Promise<PrintPickupLocation[]>;
}
export async function createPrintOrder(request: CreatePrintOrderRequest, token: string) {
  return normalizeOrder(await api.createPrintOrder(request, token));
}
export async function loadMyPrintOrders(token: string): Promise<PaginatedResult<PrintOrder>> {
  const response = await api.listMyPrintOrders(token);
  return { ...response, results: response.results.map(normalizeOrder) };
}
export async function loadPrintOrderDetail(id: Id, token: string) {
  return normalizeOrder(await api.getPrintOrderDetail(id, token));
}
export async function cancelPrintOrder(id: Id, token: string) {
  await api.cancelPrintOrder(id, token);
}
