import { apiClient } from '../client';
import { endpoints } from '../endpoints';
import type {
  ApiListParams,
  EmptyResponse,
  GroupJoinResult,
  GroupMessage,
  GroupRecord,
  GroupWhatsAppTicket,
  SendGroupMessageRequest,
} from '../types';
import type { PaginatedResult } from '../pagination';
import { toPaginationQuery } from '../pagination';

export function listAvailableGroups(
  authToken: string,
  params?: ApiListParams,
): Promise<PaginatedResult<GroupRecord>> {
  return apiClient.get<PaginatedResult<GroupRecord>>(endpoints.groups.available, {
    authToken,
    query: toPaginationQuery(params),
  });
}

export function listMyGroups(
  authToken: string,
  params?: ApiListParams,
): Promise<PaginatedResult<GroupRecord>> {
  return apiClient.get<PaginatedResult<GroupRecord>>(endpoints.groups.my, {
    authToken,
    query: toPaginationQuery(params),
  });
}

export function getGroupDetail(groupId: string | number, authToken: string): Promise<GroupRecord> {
  return apiClient.get<GroupRecord>(endpoints.groups.detail(groupId), {
    authToken,
  });
}

export function joinGroup(groupId: string | number, authToken: string): Promise<GroupJoinResult> {
  return apiClient.post<GroupJoinResult, EmptyResponse>(
    endpoints.groups.join(groupId),
    {},
    { authToken },
  );
}

export function leaveGroup(groupId: string | number, authToken: string): Promise<EmptyResponse> {
  return apiClient.post<EmptyResponse, EmptyResponse>(
    endpoints.groups.leave(groupId),
    {},
    { authToken },
  );
}

export function listGroupMessages(
  groupId: string | number,
  authToken: string,
): Promise<PaginatedResult<GroupMessage>> {
  return apiClient.get<PaginatedResult<GroupMessage>>(endpoints.groups.messages(groupId), {
    authToken,
  });
}

export function sendGroupMessage(
  groupId: string | number,
  input: SendGroupMessageRequest,
  authToken: string,
): Promise<GroupMessage> {
  return apiClient.post<GroupMessage, SendGroupMessageRequest>(
    endpoints.groups.messages(groupId),
    input,
    { authToken },
  );
}

export function requestGroupWhatsAppTicket(
  groupId: string | number,
  authToken: string,
): Promise<GroupWhatsAppTicket> {
  return apiClient.post<GroupWhatsAppTicket, EmptyResponse>(
    endpoints.groups.whatsappTicket(groupId),
    {},
    { authToken },
  );
}
