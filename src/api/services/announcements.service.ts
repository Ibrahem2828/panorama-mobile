import { apiClient } from '../client';
import { endpoints } from '../endpoints';
import type { AnnouncementRecord } from '../types';
import type { PaginatedResult } from '../pagination';

export function listRelevantAnnouncements(authToken: string) {
  return apiClient.get<PaginatedResult<AnnouncementRecord>>(endpoints.announcements.list, {
    authToken,
  });
}
