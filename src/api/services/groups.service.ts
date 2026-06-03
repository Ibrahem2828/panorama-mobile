import { apiClient } from '../client';
import { endpoints } from '../endpoints';
import type { EmptyResponse, GroupJoinResult, GroupRecord } from '../types';
import type { PaginatedResult } from '../pagination';

export function listAvailableGroups(authToken: string): Promise<PaginatedResult<GroupRecord>> {
  return apiClient.get<PaginatedResult<GroupRecord>>(endpoints.groups.available, {
    authToken,
  });
}

export function listMyGroups(authToken: string): Promise<PaginatedResult<GroupRecord>> {
  return apiClient.get<PaginatedResult<GroupRecord>>(endpoints.groups.my, {
    authToken,
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
