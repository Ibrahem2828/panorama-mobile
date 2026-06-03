import { apiClient } from '../client';
import { endpoints } from '../endpoints';
import type {
  AddSupportTicketMessageRequest,
  CreateSupportTicketRequest,
  SupportTicket,
  SupportTicketMessage,
} from '../types';
import type { PaginatedResult } from '../pagination';

export function createSupportTicket(
  input: CreateSupportTicketRequest,
  authToken: string,
): Promise<SupportTicket> {
  return apiClient.post<SupportTicket, CreateSupportTicketRequest>(
    endpoints.support.createTicket,
    input,
    { authToken },
  );
}

export function listMySupportTickets(authToken: string): Promise<PaginatedResult<SupportTicket>> {
  return apiClient.get<PaginatedResult<SupportTicket>>(endpoints.support.myTickets, {
    authToken,
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
  input: AddSupportTicketMessageRequest,
  authToken: string,
): Promise<SupportTicketMessage | unknown> {
  return apiClient.post<SupportTicketMessage | unknown, AddSupportTicketMessageRequest>(
    endpoints.support.addMessage(ticketId),
    input,
    { authToken },
  );
}
