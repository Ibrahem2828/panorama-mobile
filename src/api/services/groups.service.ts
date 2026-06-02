import { apiClient } from '../client';
import { endpoints } from '../endpoints';
import type { ApiListParams, EmptyResponse, GroupMessage, GroupSummary } from '../types';
import type { PaginatedResult } from '../pagination';
import { toPaginationQuery } from '../pagination';

export function listAvailableGroups(params?: ApiListParams, authToken?: string | null) {
  return apiClient.get<PaginatedResult<GroupSummary>>(endpoints.groups.available, {
    authToken,
    query: toPaginationQuery(params),
  });
}

export function listMyGroups(params?: ApiListParams, authToken?: string | null) {
  return apiClient.get<PaginatedResult<GroupSummary>>(endpoints.groups.my, {
    authToken,
    query: toPaginationQuery(params),
  });
}

export function getGroupDetail(groupId: string | number, authToken?: string | null) {
  return apiClient.get<GroupSummary>(endpoints.groups.detail(groupId), {
    authToken,
  });
}

export function joinGroup(groupId: string | number, authToken?: string | null) {
  return apiClient.post<EmptyResponse, EmptyResponse>(
    endpoints.groups.join(groupId),
    {},
    { authToken },
  );
}

export function leaveGroup(groupId: string | number, authToken?: string | null) {
  return apiClient.post<EmptyResponse, EmptyResponse>(
    endpoints.groups.leave(groupId),
    {},
    { authToken },
  );
}

export function listGroupMessages(
  groupId: string | number,
  params?: ApiListParams,
  authToken?: string | null,
) {
  return apiClient.get<PaginatedResult<GroupMessage>>(endpoints.groups.messages(groupId), {
    authToken,
    query: toPaginationQuery(params),
  });
}
