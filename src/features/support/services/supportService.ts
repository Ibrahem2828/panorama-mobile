import {
  normalizeApiError,
  runIdempotentAction,
  supportService as apiSupportService,
  type FileAccessTicket,
  type PaginatedResult,
  type UploadOptions,
  type SupportTicket as ApiSupportTicket,
  type SupportTicketMessage as ApiSupportTicketMessage,
} from '../../../api';
import type { TranslationCatalog } from '../../../i18n';
import type { StatusVariant } from '../../../types/common';
import { appendLocalFile, localFileSignature } from '../../attachments/services/localFile';
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
    has_attachment: message.has_attachment === true,
    attachment_preview_endpoint: toNullableText(message.attachment_preview_endpoint),
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
    case 'waiting_user':
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
    case 'waiting_user':
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
    case 'normal':
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

/** JSON for a text-only ticket, multipart (field `attachment`) when an image is attached. */
export function buildCreateTicketBody(input: CreateSupportTicketInput) {
  const fields = {
    category: input.category,
    subject: input.subject.trim(),
    message: input.message.trim(),
  };

  if (!input.attachment) {
    return fields;
  }

  const form = new FormData();

  Object.entries(fields).forEach(([key, value]) => form.append(key, value));
  appendLocalFile(form, 'attachment', input.attachment);

  return form;
}

export function buildReplyBody(input: AddSupportTicketMessageInput) {
  const fields = { message: input.message.trim() };

  if (!input.attachment) {
    return fields;
  }

  const form = new FormData();

  form.append('message', fields.message);
  appendLocalFile(form, 'attachment', input.attachment);

  return form;
}

export async function createSupportTicket(
  input: CreateSupportTicketInput,
  authToken: string,
  options?: UploadOptions,
): Promise<SupportTicket> {
  // The key is scoped to the content (not the multipart body), so a retry re-uses it.
  const scope = [
    input.category,
    input.subject,
    input.message,
    localFileSignature(input.attachment),
  ];

  return runIdempotentAction('support:create-ticket', scope, async (idempotencyKey) =>
    normalizeTicket(
      await apiSupportService.createSupportTicket(
        buildCreateTicketBody(input) as never,
        authToken,
        idempotencyKey,
        options,
      ),
    ),
  );
}

export const SUPPORT_TICKETS_PAGE_SIZE = 15;

export async function loadMySupportTickets(
  authToken: string,
  params: { page?: number; status?: string } = {},
): Promise<PaginatedResult<SupportTicket>> {
  return normalizeList(
    await apiSupportService.listMySupportTickets(authToken, {
      page: params.page ?? 1,
      pageSize: SUPPORT_TICKETS_PAGE_SIZE,
      status: params.status,
    }),
  );
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
  options?: UploadOptions,
): Promise<void> {
  const scope = [input.message, localFileSignature(input.attachment)];

  await runIdempotentAction(`support:reply:${String(ticketId)}`, scope, (idempotencyKey) =>
    apiSupportService.addSupportTicketMessage(
      ticketId,
      buildReplyBody(input) as never,
      authToken,
      idempotencyKey,
      options,
    ),
  );
}

export async function requestSupportAttachmentTicket(
  messageId: Id,
  authToken: string,
): Promise<FileAccessTicket> {
  return apiSupportService.requestSupportAttachmentTicket(messageId, authToken);
}

/** Whether a user pressing "cancel" (not the network) ended the upload. */
export function isUploadCancelled(error: unknown, signal?: AbortSignal): boolean {
  return Boolean(signal?.aborted) && normalizeApiError(error).code === 'TIMEOUT';
}
