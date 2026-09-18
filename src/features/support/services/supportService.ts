import {
  normalizeApiError,
  supportService as apiSupportService,
  type PaginatedResult,
  type SupportTicket as ApiSupportTicket,
  type SupportTicketMessage as ApiSupportTicketMessage,
} from '../../../api';
import type { TranslationCatalog } from '../../../i18n';
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

type SupportCatalog = TranslationCatalog['support'];

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

export function getSupportTicketTitle(ticket: SupportTicket, t: SupportCatalog): string {
  return toText(ticket.subject) ?? toText(ticket.title) ?? t.fallbackTitle(String(ticket.id));
}

export function getSupportTicketPreview(ticket: SupportTicket): string | null {
  return toText(ticket.message) ?? null;
}

export function getSupportTicketStatusLabel(
  status: SupportTicketStatus | undefined,
  t: SupportCatalog,
  unknownLabel: string,
): string {
  switch (status) {
    case 'open':
      return t.status.open;
    case 'pending':
      return t.status.waiting;
    case 'in_progress':
      return t.status.inProgress;
    case 'answered':
      return t.status.answered;
    case 'resolved':
      return t.status.resolved;
    case 'closed':
      return t.status.closed;
    case 'rejected':
      return t.status.rejected;
    default:
      return unknownLabel;
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

export function getSupportCategoryLabel(
  category: SupportTicketCategory | undefined,
  t: SupportCatalog,
): string {
  switch (category) {
    case 'technical':
      return t.category.technical;
    case 'account':
      return t.category.account;
    case 'verification':
      return t.category.verification;
    case 'printing':
      return t.category.printing;
    case 'files':
      return t.category.files;
    case 'groups':
      return t.category.groups;
    case 'other':
      return t.category.other;
    default:
      return category ? t.category.custom : t.category.none;
  }
}

export function getSupportPriorityLabel(
  priority: SupportTicketPriority | undefined,
  t: SupportCatalog,
): string {
  switch (priority) {
    case 'low':
      return t.priority.low;
    case 'medium':
      return t.priority.medium;
    case 'high':
      return t.priority.high;
    case 'urgent':
      return t.priority.urgent;
    default:
      return priority ? t.priority.custom : t.priority.none;
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

export function getSupportMessageText(message: SupportTicketMessage, t: SupportCatalog): string {
  return (
    toText(message.message) ?? toText(message.body) ?? toText(message.content) ?? t.emptyMessageBody
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

export function toSafeSupportErrorMessage(error: unknown, t: SupportCatalog): string {
  const normalizedError = normalizeApiError(error);

  if (normalizedError.code === 'NETWORK_ERROR' || normalizedError.code === 'TIMEOUT') {
    return t.errors.network;
  }

  if (normalizedError.code === 'UNAUTHORIZED') {
    return t.errors.unauthorized;
  }

  if (normalizedError.code === 'FORBIDDEN') {
    return t.errors.permission;
  }

  return normalizedError.message || t.errors.generic;
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
