import {
  normalizeApiError,
  printingService as apiPrintingService,
  type CreatePrintOrderRequest,
  type PaginatedResult,
  type PrintOrder as ApiPrintOrder,
  type PrintOrderItem as ApiPrintOrderItem,
} from '../../../api';
import type {
  Id,
  PrintDraft,
  PrintDraftValidation,
  PrintOrder,
  PrintOrderItem,
  PrintOrderStatus,
  PrintStatusPresentation,
} from '../types';

const NETWORK_MESSAGE = 'تعذر تحميل طلبات الطباعة. تحقق من اتصال الإنترنت وحاول مرة أخرى.';
const UNAUTHORIZED_MESSAGE = 'انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى.';
const PERMISSION_MESSAGE = 'لا تملك صلاحية الوصول إلى طلبات الطباعة حاليا.';
const GENERIC_MESSAGE = 'تعذر تنفيذ عملية الطباعة. حاول مرة أخرى.';
const MISSING_FILE_MESSAGE = 'اختر ملفا قابلا للوصول قبل إنشاء طلب الطباعة.';
const INVALID_COPIES_MESSAGE = 'عدد النسخ يجب أن يكون بين 1 و99.';

const CANCELLABLE_STATUSES = new Set<PrintOrderStatus>(['submitted', 'pending', 'accepted']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toText(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }

  if (typeof value === 'number') {
    return String(value);
  }

  return undefined;
}

function toNullableText(value: unknown): string | null {
  return toText(value) ?? null;
}

function toId(value: unknown): Id | null {
  if (typeof value === 'string' || typeof value === 'number') {
    return value;
  }

  return null;
}

function toNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function toStatus(value: unknown): PrintOrderStatus {
  return toText(value) ?? 'submitted';
}

function normalizeItem(item: ApiPrintOrderItem): PrintOrderItem {
  return {
    ...item,
    id: toId(item.id) ?? item.id,
    source_file:
      typeof item.source_file === 'string' ||
      typeof item.source_file === 'number' ||
      isRecord(item.source_file)
        ? item.source_file
        : null,
    copies: Math.max(1, Math.min(99, toNumber(item.copies, 1))),
    pages_count: typeof item.pages_count === 'number' ? item.pages_count : null,
    created_at: toText(item.created_at),
    updated_at: toText(item.updated_at),
  };
}

function normalizeOrder(order: ApiPrintOrder): PrintOrder {
  return {
    ...order,
    id: order.id,
    status: toStatus(order.status),
    items: Array.isArray(order.items) ? order.items.map(normalizeItem) : [],
    user_notes: toNullableText(order.user_notes),
    internal_notes: toNullableText(order.internal_notes),
    rejection_reason: toNullableText(order.rejection_reason),
    total_price: order.total_price ?? null,
    totalPrice: order.totalPrice ?? null,
    created_at: toText(order.created_at),
    updated_at: toText(order.updated_at),
    submitted_at: toText(order.submitted_at),
    ready_at: toNullableText(order.ready_at),
    delivered_at: toNullableText(order.delivered_at),
  };
}

function normalizeList(response: PaginatedResult<ApiPrintOrder>): PaginatedResult<PrintOrder> {
  return {
    ...response,
    results: response.results.map(normalizeOrder),
  };
}

function getRelatedEntityLabel(value: unknown): string | null {
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }

  if (!isRecord(value)) {
    return null;
  }

  return (
    toText(value.title) ??
    toText(value.name) ??
    toText(value.label) ??
    toText(value.filename) ??
    toText(value.id) ??
    null
  );
}

export function getPrintOrderStatusPresentation(status: PrintOrderStatus): PrintStatusPresentation {
  switch (status) {
    case 'submitted':
    case 'pending':
      return {
        label: 'بانتظار المراجعة',
        actionMessage: 'تم استلام طلبك',
        variant: 'warning',
      };
    case 'accepted':
      return { label: 'مقبول', actionMessage: 'تم قبول طلبك', variant: 'info' };
    case 'in_progress':
    case 'printing':
      return {
        label: 'قيد الطباعة',
        actionMessage: 'طلبك قيد التجهيز',
        variant: 'brand',
      };
    case 'ready':
    case 'ready_for_pickup':
      return {
        label: 'جاهز للاستلام',
        actionMessage: 'طلبك جاهز للاستلام',
        variant: 'success',
      };
    case 'delivered':
      return {
        label: 'تم التسليم',
        actionMessage: 'تم إكمال الطلب',
        variant: 'success',
      };
    case 'cancelled':
    case 'canceled':
      return {
        label: 'ملغي',
        actionMessage: 'تم إلغاء الطلب',
        variant: 'neutral',
      };
    case 'rejected':
      return {
        label: 'مرفوض',
        actionMessage: 'تم إلغاء الطلب',
        variant: 'error',
      };
    default:
      return {
        label: status || 'حالة غير معروفة',
        actionMessage: 'تابع حالة الطلب من هذه الشاشة',
        variant: 'neutral',
      };
  }
}

export function canCancelPrintOrder(order: PrintOrder): boolean {
  return CANCELLABLE_STATUSES.has(order.status);
}

export function getPrintOrderDisplayTitle(order: PrintOrder): string {
  return `طلب طباعة #${String(order.id)}`;
}

export function getPrintOrderItemsCount(order: PrintOrder): number {
  return order.items.length;
}

export function getPrintOrderCopiesCount(order: PrintOrder): number {
  return order.items.reduce((total, item) => total + item.copies, 0);
}

export function getPrintOrderItemFileLabel(item: PrintOrderItem): string {
  return getRelatedEntityLabel(item.source_file) ?? 'ملف مطبوع';
}

export function formatPrintOrderDate(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleDateString('ar-SY');
}

export function formatPrintOrderPrice(order: PrintOrder): string | null {
  const price = order.total_price ?? order.totalPrice;

  if (price === null || price === undefined || price === '') {
    return null;
  }

  return typeof price === 'number' ? `${price} ل.س` : price;
}

export function validatePrintDraft(draft: PrintDraft): PrintDraftValidation {
  const validation: PrintDraftValidation = {};

  if (draft.sourceFileId === null) {
    validation.sourceFileId = MISSING_FILE_MESSAGE;
  }

  if (!Number.isInteger(draft.copies) || draft.copies < 1 || draft.copies > 99) {
    validation.copies = INVALID_COPIES_MESSAGE;
  }

  return validation;
}

export function hasPrintDraftValidationErrors(validation: PrintDraftValidation): boolean {
  return Boolean(validation.sourceFileId || validation.copies);
}

export function buildCreatePrintOrderRequest(draft: PrintDraft): CreatePrintOrderRequest | null {
  if (draft.sourceFileId === null) {
    return null;
  }

  const notes = draft.userNotes.trim();

  return {
    items: [
      {
        source_file: draft.sourceFileId,
        copies: draft.copies,
      },
    ],
    ...(notes ? { user_notes: notes } : {}),
  };
}

export function toSafePrintingErrorMessage(error: unknown): string {
  const normalizedError = normalizeApiError(error);

  if (normalizedError.code === 'NETWORK_ERROR' || normalizedError.code === 'TIMEOUT') {
    return NETWORK_MESSAGE;
  }

  if (normalizedError.code === 'UNAUTHORIZED') {
    return UNAUTHORIZED_MESSAGE;
  }

  if (normalizedError.code === 'FORBIDDEN') {
    return PERMISSION_MESSAGE;
  }

  return normalizedError.message || GENERIC_MESSAGE;
}

export async function createPrintOrder(
  request: CreatePrintOrderRequest,
  authToken: string,
): Promise<PrintOrder> {
  return normalizeOrder(await apiPrintingService.createPrintOrder(request, authToken));
}

export async function loadMyPrintOrders(authToken: string): Promise<PaginatedResult<PrintOrder>> {
  return normalizeList(await apiPrintingService.listMyPrintOrders(authToken));
}

export async function loadPrintOrderDetail(orderId: Id, authToken: string): Promise<PrintOrder> {
  return normalizeOrder(await apiPrintingService.getPrintOrderDetail(orderId, authToken));
}

export async function cancelPrintOrder(orderId: Id, authToken: string): Promise<void> {
  await apiPrintingService.cancelPrintOrder(orderId, authToken);
}
