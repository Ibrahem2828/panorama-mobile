import {
  normalizeApiError,
  printingService as api,
  runIdempotentAction,
  type PaginatedResult,
  type PrintOrder as ApiPrintOrder,
  type PrintQuoteRequest,
  type CreatePrintOrderRequest,
  type UploadProgress,
} from '../../../api';
import type { Locale, TranslationCatalog } from '../../../i18n';
import type {
  Id,
  PrintDraft,
  PrintOrder,
  PrintPickupLocation,
  PrintQuote,
  PrintStatusPresentation,
} from '../types';
import { buildOrderBody, buildQuoteBody, orderSignature } from './printDraft';

type PrintingCatalog = TranslationCatalog['printing'];

export const PRINT_ORDERS_PAGE_SIZE = 10;

export type PrintTransferOptions = {
  signal?: AbortSignal;
  onUploadProgress?: (progress: UploadProgress) => void;
};

export function normalizeOrder(order: ApiPrintOrder): PrintOrder {
  return {
    ...order,
    id: order.id,
    status: order.status ?? 'submitted',
    items: Array.isArray(order.items)
      ? order.items.map((item) => ({ ...item, copies: Number(item.copies ?? 1) }))
      : [],
    status_history: Array.isArray(order.status_history) ? order.status_history : [],
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

export function canCancelPrintOrder(order: Pick<PrintOrder, 'status'>): boolean {
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
    item.original_file_name ||
    (typeof item.source_file === 'object' && item.source_file && 'title' in item.source_file
      ? String(item.source_file.title)
      : item.has_uploaded_file
        ? t.order.uploadedFile
        : t.order.fallbackFileTitle)
  );
}

const DATE_LOCALES: Record<Locale, string> = { ar: 'ar-SY', en: 'en-GB' };

export function formatPrintOrderDate(value: string | null | undefined, locale: Locale) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date.toLocaleDateString(DATE_LOCALES[locale]);
}

export function formatPrintOrderDateTime(value: string | null | undefined, locale: Locale) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? null
    : date.toLocaleString(DATE_LOCALES[locale], {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
}

/** `15000.00` becomes `15,000`; only meaningful decimals are kept. Falls back to the raw text. */
export function formatMoneyAmount(value: string | number | null | undefined): string | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return String(value);
  }

  return amount.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

export function formatPrintMoney(
  value: string | number | null | undefined,
  currency: string | null | undefined,
): string | null {
  const amount = formatMoneyAmount(value);

  return amount === null ? null : `${amount} ${currency || 'SYP'}`;
}

export function formatPrintOrderPrice(order: Pick<PrintOrder, 'total_price' | 'currency'>) {
  return formatPrintMoney(order.total_price, order.currency);
}

export function isUserAbort(error: unknown, signal?: AbortSignal): boolean {
  return Boolean(signal?.aborted) && normalizeApiError(error).code === 'TIMEOUT';
}

export function toSafePrintingErrorMessage(error: unknown, t: PrintingCatalog): string {
  const normalized = normalizeApiError(error);
  if (normalized.code === 'NETWORK_ERROR' || normalized.code === 'TIMEOUT') return t.errors.network;
  if (normalized.code === 'UNAUTHORIZED') return t.errors.unauthorized;
  if (normalized.code === 'FORBIDDEN') return t.errors.forbidden;
  if (normalized.status === 413) return t.errors.tooLarge;
  return normalized.message || t.errors.generic;
}

export async function calculatePrintQuote(
  draft: PrintDraft,
  token: string,
  options?: PrintTransferOptions,
): Promise<PrintQuote> {
  const body = buildQuoteBody(draft);

  return api.quotePrintOrder(body as PrintQuoteRequest | FormData, token, options);
}
export async function loadPickupLocations(token: string): Promise<PrintPickupLocation[]> {
  const response: unknown = await api.listPickupLocations(token);
  const list = Array.isArray(response)
    ? response
    : Array.isArray((response as { results?: unknown })?.results)
      ? (response as { results: unknown[] }).results
      : [];

  return (list as PrintPickupLocation[])
    .filter((location) => location.is_active !== false)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
}
export async function createPrintOrder(
  draft: PrintDraft,
  token: string,
  options?: PrintTransferOptions,
): Promise<PrintOrder> {
  // One key per "place this order" action: a retry of the same order re-uses it, so the
  // backend returns the original order instead of creating a duplicate. The scope payload
  // is the order signature (not the multipart body), which stays stable across retries.
  return runIdempotentAction('print-order:create', orderSignature(draft), async (idempotencyKey) =>
    normalizeOrder(
      await api.createPrintOrder(
        buildOrderBody(draft) as CreatePrintOrderRequest | FormData,
        token,
        idempotencyKey,
        options,
      ),
    ),
  );
}
export async function loadMyPrintOrders(
  token: string,
  params: { page: number; status?: string },
): Promise<PaginatedResult<PrintOrder>> {
  const response = await api.listMyPrintOrders(token, {
    page: params.page,
    pageSize: PRINT_ORDERS_PAGE_SIZE,
    status: params.status,
  });
  return { ...response, results: response.results.map(normalizeOrder) };
}
export async function loadPrintOrderDetail(id: Id, token: string) {
  return normalizeOrder(await api.getPrintOrderDetail(id, token));
}
export async function cancelPrintOrder(id: Id, token: string) {
  await api.cancelPrintOrder(id, token);
}
export async function requestPrintItemTicket(itemId: Id, token: string) {
  return api.requestPrintItemAccessTicket(itemId, token);
}
