import { apiClient } from '../client';
import { endpoints } from '../endpoints';
import type { ApiListParams, FileRecord } from '../types';
import type { PaginatedResult } from '../pagination';
import { toPaginationQuery } from '../pagination';

export function listFiles(params?: ApiListParams, authToken?: string | null) {
  return apiClient.get<PaginatedResult<FileRecord>>(endpoints.files.list, {
    authToken,
    query: toPaginationQuery(params),
  });
}

export function getFileDetail(fileId: string | number, authToken?: string | null) {
  return apiClient.get<FileRecord>(endpoints.files.detail(fileId), {
    authToken,
  });
}

export function listGroupFiles(
  groupId: string | number,
  params?: ApiListParams,
  authToken?: string | null,
) {
  return apiClient.get<PaginatedResult<FileRecord>>(endpoints.groups.files(groupId), {
    authToken,
    query: toPaginationQuery(params),
  });
}
