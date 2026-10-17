import { apiClient } from '../client';
import { endpoints } from '../endpoints';
import type { AnnouncementRecord, ApiListParams } from '../types';
import type { PaginatedResult } from '../pagination';
import { toPaginationQuery } from '../pagination';

export function listRelevantAnnouncements(authToken: string, params?: ApiListParams) {
  return apiClient.get<PaginatedResult<AnnouncementRecord>>(endpoints.announcements.list, {
    authToken,
    query: toPaginationQuery(params),
  });
}

export function getAnnouncementDetail(announcementId: string | number, authToken: string) {
  return apiClient.get<AnnouncementRecord>(endpoints.announcements.detail(announcementId), {
    authToken,
  });
}
