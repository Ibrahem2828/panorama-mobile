import { apiClient } from '../client';
import { endpoints } from '../endpoints';
import type { FileRecord } from '../types';
import type { PaginatedResult } from '../pagination';

export function listFiles(authToken: string): Promise<PaginatedResult<FileRecord>> {
  return apiClient.get<PaginatedResult<FileRecord>>(endpoints.files.list, {
    authToken,
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
