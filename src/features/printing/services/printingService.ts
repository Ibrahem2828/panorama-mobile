import {
  normalizeApiError,
  printingService as api,
  type CreatePrintOrderRequest,
  type PaginatedResult,
  type PrintOrder as ApiPrintOrder,
} from '../../../api';
import type {
  Id,
  PrintDraft,
  PrintDraftValidation,
  PrintOrder,
  PrintPickupLocation,
  PrintQuote,
  PrintStatusPresentation,
} from '../types';

const MISSING_FILE_MESSAGE = 'اختر ملفًا قابلًا للطباعة.';
const INVALID_COPIES_MESSAGE = 'عدد النسخ يجب أن يكون بين 1 و99.';

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

export function getPrintOrderStatusPresentation(status: string): PrintStatusPresentation {
  switch (status) {
    case 'submitted':
      return { label: 'تم الإرسال', actionMessage: 'تم استلام طلبك', variant: 'warning' };
    case 'under_review':
      return { label: 'قيد المراجعة', actionMessage: 'تتم مراجعة الطلب', variant: 'info' };
    case 'accepted':
      return { label: 'مقبول', actionMessage: 'تم قبول الطلب', variant: 'info' };
    case 'printing':
      return { label: 'قيد الطباعة', actionMessage: 'يتم تجهيز طلبك', variant: 'brand' };
    case 'ready':
      return { label: 'جاهز للاستلام', actionMessage: 'يمكنك استلام الطلب', variant: 'success' };
    case 'delivered':
      return { label: 'تم التسليم', actionMessage: 'اكتمل الطلب', variant: 'success' };
    case 'cancelled':
      return { label: 'ملغي', actionMessage: 'تم إلغاء الطلب', variant: 'neutral' };
    case 'rejected':
      return { label: 'مرفوض', actionMessage: 'تعذر تنفيذ الطلب', variant: 'error' };
    default:
      return { label: status || 'غير معروف', actionMessage: 'تابع حالة الطلب', variant: 'neutral' };
  }
}

export function canCancelPrintOrder(order: PrintOrder): boolean {
  return ['submitted', 'under_review', 'accepted'].includes(order.status);
}
export function getPrintOrderDisplayTitle(order: PrintOrder) {
  return `طلب طباعة #${String(order.id)}`;
}
export function getPrintOrderItemsCount(order: PrintOrder) {
  return order.items.length;
}
export function getPrintOrderCopiesCount(order: PrintOrder) {
  return order.items.reduce((sum, item) => sum + item.copies, 0);
}
export function getPrintOrderItemFileLabel(item: PrintOrder['items'][number]) {
  return (
    item.source_file_title ||
    (typeof item.source_file === 'object' && item.source_file && 'title' in item.source_file
      ? String(item.source_file.title)
      : 'ملف مطبوع')
  );
}
export function formatPrintOrderDate(value?: string | null) {
  return value ? new Date(value).toLocaleDateString('ar-SY') : null;
}
export function formatPrintOrderPrice(order: PrintOrder) {
  if (order.total_price == null) return null;
  return `${order.total_price} ${order.currency ?? 'SYP'}`;
}

export function validatePrintDraft(draft: PrintDraft): PrintDraftValidation {
  const validation: PrintDraftValidation = {};
  if (draft.sourceFileId == null) validation.sourceFileId = MISSING_FILE_MESSAGE;
  if (!Number.isInteger(draft.copies) || draft.copies < 1 || draft.copies > 99)
    validation.copies = INVALID_COPIES_MESSAGE;
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

export function toSafePrintingErrorMessage(error: unknown): string {
  const normalized = normalizeApiError(error);
  if (normalized.code === 'NETWORK_ERROR' || normalized.code === 'TIMEOUT')
    return 'تعذر الاتصال بخدمة الطباعة.';
  if (normalized.code === 'UNAUTHORIZED') return 'انتهت الجلسة. يرجى تسجيل الدخول.';
  if (normalized.code === 'FORBIDDEN') return 'لا تملك صلاحية استخدام هذه الخدمة.';
  return normalized.message || 'تعذر تنفيذ عملية الطباعة.';
}

export async function calculatePrintQuote(draft: PrintDraft, token: string): Promise<PrintQuote> {
  const item = buildPrintItem(draft);
  if (!item) throw new Error(MISSING_FILE_MESSAGE);
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
