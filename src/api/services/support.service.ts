import { apiClient } from '../client';
import { endpoints } from '../endpoints';
import type {
  AddSupportTicketMessageRequest,
  ApiListParams,
  CreateSupportTicketRequest,
  SupportTicket,
} from '../types';
import type { PaginatedResult } from '../pagination';
import { toPaginationQuery } from '../pagination';

export function createSupportTicket(
  request: CreateSupportTicketRequest | FormData,
  authToken?: string | null,
) {
  return apiClient.post<SupportTicket, CreateSupportTicketRequest | FormData>(
    endpoints.support.createTicket,
    request,
    { authToken },
  );
}

export function listMySupportTickets(params?: ApiListParams, authToken?: string | null) {
  return apiClient.get<PaginatedResult<SupportTicket>>(endpoints.support.myTickets, {
    authToken,
    query: toPaginationQuery(params),
  });
}

export function getSupportTicketDetail(ticketId: string | number, authToken?: string | null) {
  return apiClient.get<SupportTicket>(endpoints.support.ticketDetail(ticketId), {
    authToken,
  });
}

export function addSupportTicketMessage(
  ticketId: string | number,
  request: AddSupportTicketMessageRequest | FormData,
  authToken?: string | null,
) {
  return apiClient.post<SupportTicket, AddSupportTicketMessageRequest | FormData>(
    endpoints.support.addMessage(ticketId),
    request,
    { authToken },
  );
}
