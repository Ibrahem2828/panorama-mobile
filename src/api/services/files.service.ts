import { apiClient } from '../client';
import { endpoints } from '../endpoints';
import type { ApiListParams, FileAccessTicket, FileRecord } from '../types';
import type { PaginatedResult } from '../pagination';
import { toPaginationQuery } from '../pagination';

export function listFiles(
  authToken: string,
  params?: ApiListParams,
): Promise<PaginatedResult<FileRecord>> {
  return apiClient.get<PaginatedResult<FileRecord>>(endpoints.files.list, {
    authToken,
    query: toPaginationQuery(params),
  });
}

export function getFileDetail(fileId: string | number, authToken: string): Promise<FileRecord> {
  return apiClient.get<FileRecord>(endpoints.files.detail(fileId), {
    authToken,
  });
}

export function listGroupFiles(
  groupId: string | number,
  authToken: string,
): Promise<PaginatedResult<FileRecord>> {
  return apiClient.get<PaginatedResult<FileRecord>>(endpoints.groups.files(groupId), {
    authToken,
  });
}

export function requestFileAccessTicket(
  fileId: string | number,
  authToken: string,
): Promise<FileAccessTicket> {
  return apiClient.post<FileAccessTicket, { purpose: 'view' }>(
    endpoints.files.accessTicket(fileId),
    { purpose: 'view' },
    { authToken },
  );
}
