import { apiClient } from '../client';
import { endpoints } from '../endpoints';
import type {
  AddSupportTicketMessageRequest,
  ApiListParams,
  CreateSupportTicketRequest,
  FileAccessTicket,
  SupportTicket,
  SupportTicketMessage,
} from '../types';
import type { PaginatedResult } from '../pagination';
import { toPaginationQuery } from '../pagination';
import type { UploadOptions } from '../uploadTransport';

/** Attachments restart this stall timer on every progress event. */
export const SUPPORT_UPLOAD_STALL_TIMEOUT_MS = 60_000;

/** JSON for a text-only request, multipart when an attachment is included. */
type Body<T> = T | FormData;

export function createSupportTicket(
  input: Body<CreateSupportTicketRequest>,
  authToken: string,
  idempotencyKey?: string,
  options?: UploadOptions,
): Promise<SupportTicket> {
  return apiClient.post<SupportTicket, Body<CreateSupportTicketRequest>>(
    endpoints.support.createTicket,
    input,
    {
      authToken,
      idempotencyKey,
      timeoutMs: SUPPORT_UPLOAD_STALL_TIMEOUT_MS,
      signal: options?.signal,
      onUploadProgress: options?.onUploadProgress,
    },
  );
}

export function listMySupportTickets(
  authToken: string,
  params?: ApiListParams & { status?: string },
): Promise<PaginatedResult<SupportTicket>> {
  return apiClient.get<PaginatedResult<SupportTicket>>(endpoints.support.myTickets, {
    authToken,
    query: { ...toPaginationQuery(params), status: params?.status },
  });
}

export function getSupportTicketDetail(
  ticketId: string | number,
  authToken: string,
): Promise<SupportTicket> {
  return apiClient.get<SupportTicket>(endpoints.support.ticketDetail(ticketId), {
    authToken,
  });
}

export function addSupportTicketMessage(
  ticketId: string | number,
  input: Body<AddSupportTicketMessageRequest>,
  authToken: string,
  idempotencyKey?: string,
  options?: UploadOptions,
): Promise<SupportTicketMessage | unknown> {
  return apiClient.post<SupportTicketMessage | unknown, Body<AddSupportTicketMessageRequest>>(
    endpoints.support.addMessage(ticketId),
    input,
    {
      authToken,
      idempotencyKey,
      timeoutMs: SUPPORT_UPLOAD_STALL_TIMEOUT_MS,
      signal: options?.signal,
      onUploadProgress: options?.onUploadProgress,
    },
  );
}

/** A short-lived ticket to view one message's attachment inside the app. */
export function requestSupportAttachmentTicket(
  messageId: string | number,
  authToken: string,
): Promise<FileAccessTicket> {
  return apiClient.post<FileAccessTicket, Record<string, never>>(
    endpoints.support.attachmentTicket(messageId),
    {},
    { authToken },
  );
}
