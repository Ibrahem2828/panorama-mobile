import {
  normalizeApiError,
  supportService as apiSupportService,
  type PaginatedResult,
  type SupportTicket as ApiSupportTicket,
  type SupportTicketMessage as ApiSupportTicketMessage,
} from '../../../api';
import type { StatusVariant } from '../../../types/common';
import type {
  AddSupportTicketMessageInput,
  CreateSupportTicketInput,
  Id,
  SupportTicket,
  SupportTicketCategory,
  SupportTicketMessage,
  SupportTicketPriority,
  SupportTicketStatus,
} from '../types';

const NETWORK_MESSAGE = 'تعذر تحميل تذاكر الدعم. تحقق من اتصال الإنترنت وحاول مرة أخرى.';
const UNAUTHORIZED_MESSAGE = 'انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى.';
const PERMISSION_MESSAGE = 'لا تملك صلاحية الوصول إلى هذه التذكرة حاليا.';
const GENERIC_MESSAGE = 'تعذر تنفيذ عملية الدعم. حاول مرة أخرى.';

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

function normalizeMessage(message: ApiSupportTicketMessage): SupportTicketMessage {
  return {
    ...message,
    id: toId(message.id) ?? message.id,
    message: toText(message.message),
    body: toText(message.body),
    content: toText(message.content),
    sender:
      typeof message.sender === 'string' ||
      typeof message.sender === 'number' ||
      isRecord(message.sender)
        ? message.sender
        : null,
    sender_name: toNullableText(message.sender_name),
    is_staff_reply:
      typeof message.is_staff_reply === 'boolean' ? message.is_staff_reply : undefined,
    created_at: toText(message.created_at),
    updated_at: toText(message.updated_at),
  };
}

function normalizeTicket(ticket: ApiSupportTicket): SupportTicket {
  return {
    ...ticket,
    id: ticket.id,
    category: toText(ticket.category),
    subject: toText(ticket.subject),
    title: toText(ticket.title),
    message: toText(ticket.message),
    status: toText(ticket.status),
    priority: toText(ticket.priority),
    messages: Array.isArray(ticket.messages) ? ticket.messages.map(normalizeMessage) : [],
    created_at: toText(ticket.created_at),
    updated_at: toText(ticket.updated_at),
    closed_at: toNullableText(ticket.closed_at),
    resolved_at: toNullableText(ticket.resolved_at),
  };
}

function normalizeList(
  response: PaginatedResult<ApiSupportTicket>,
): PaginatedResult<SupportTicket> {
  return {
    ...response,
    results: response.results.map(normalizeTicket),
  };
}

export function getSupportTicketTitle(ticket: SupportTicket): string {
  return toText(ticket.subject) ?? toText(ticket.title) ?? `تذكرة دعم #${String(ticket.id)}`;
}

export function getSupportTicketPreview(ticket: SupportTicket): string | null {
  return toText(ticket.message) ?? null;
}

export function getSupportTicketStatusLabel(status?: SupportTicketStatus): string {
  switch (status) {
    case 'open':
      return 'مفتوحة';
    case 'pending':
      return 'قيد الانتظار';
    case 'in_progress':
      return 'قيد المعالجة';
    case 'answered':
      return 'تم الرد';
    case 'resolved':
      return 'محلولة';
    case 'closed':
      return 'مغلقة';
    case 'rejected':
      return 'مرفوضة';
    default:
      return 'غير معروف';
  }
}

export function getSupportTicketStatusVariant(status?: SupportTicketStatus): StatusVariant {
  switch (status) {
    case 'open':
      return 'info';
    case 'pending':
      return 'warning';
    case 'in_progress':
      return 'brand';
    case 'answered':
      return 'success';
    case 'resolved':
      return 'success';
    case 'closed':
      return 'neutral';
    case 'rejected':
      return 'error';
    default:
      return 'neutral';
  }
}

export function getSupportCategoryLabel(category?: SupportTicketCategory): string {
  switch (category) {
    case 'technical':
      return 'مشكلة تقنية';
    case 'account':
      return 'الحساب';
    case 'verification':
      return 'التوثيق';
    case 'printing':
      return 'الطباعة';
    case 'files':
      return 'الملفات';
    case 'groups':
      return 'الغروبات';
    case 'other':
      return 'أخرى';
    default:
      return category ? 'تصنيف مخصص' : 'غير مصنف';
  }
}

export function getSupportPriorityLabel(priority?: SupportTicketPriority): string {
  switch (priority) {
    case 'low':
      return 'منخفضة';
    case 'medium':
      return 'متوسطة';
    case 'high':
      return 'عالية';
    case 'urgent':
      return 'عاجلة';
    default:
      return priority ? 'أولوية مخصصة' : 'غير محددة';
  }
}

export function canReplyToSupportTicket(ticket: SupportTicket): boolean {
  return (
    ticket.status !== 'closed' &&
    ticket.status !== 'resolved' &&
    !ticket.closed_at &&
    !ticket.resolved_at
  );
}

export function getSupportMessageText(message: SupportTicketMessage): string {
  return (
    toText(message.message) ?? toText(message.body) ?? toText(message.content) ?? 'رسالة بدون نص'
  );
}

export function isSupportStaffMessage(message: SupportTicketMessage): boolean {
  if (typeof message.is_staff_reply === 'boolean') {
    return message.is_staff_reply;
  }

  if (!isRecord(message.sender)) {
    return false;
  }

  const role = toText(message.sender.role)?.toLowerCase();

  return role === 'admin' || role === 'it_support' || role === 'support' || role === 'staff';
}

export function formatSupportDate(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleString('ar-SY');
}

export function toSafeSupportErrorMessage(error: unknown): string {
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

export async function createSupportTicket(
  input: CreateSupportTicketInput,
  authToken: string,
): Promise<SupportTicket> {
  return normalizeTicket(await apiSupportService.createSupportTicket(input, authToken));
}

export async function loadMySupportTickets(
  authToken: string,
): Promise<PaginatedResult<SupportTicket>> {
  return normalizeList(await apiSupportService.listMySupportTickets(authToken));
}

export async function loadSupportTicketDetail(
  ticketId: Id,
  authToken: string,
): Promise<SupportTicket> {
  return normalizeTicket(await apiSupportService.getSupportTicketDetail(ticketId, authToken));
}

export async function addSupportTicketMessage(
  ticketId: Id,
  input: AddSupportTicketMessageInput,
  authToken: string,
): Promise<void> {
  await apiSupportService.addSupportTicketMessage(ticketId, input, authToken);
}
