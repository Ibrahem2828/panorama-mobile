import {
  announcementsService,
  normalizeApiError,
  notificationsService,
  type AnnouncementRecord,
} from '../../../api';
import type { Announcement, HomeData } from '../types';
import type { TranslationCatalog } from '../../../i18n';

type HomeCatalog = TranslationCatalog['home'];

function toText(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }

  return undefined;
}

function normalizeAnnouncement(announcement: AnnouncementRecord): Announcement {
  return {
    ...announcement,
    id: announcement.id,
    title: toText(announcement.title),
    description: toText(announcement.description),
    body: toText(announcement.body),
    created_at: toText(announcement.created_at),
    updated_at: toText(announcement.updated_at),
    start_date: toText(announcement.start_date) ?? null,
    end_date: toText(announcement.end_date) ?? null,
    is_active: typeof announcement.is_active === 'boolean' ? announcement.is_active : undefined,
    type: toText(announcement.type),
  };
}

export function toSafeHomeErrorMessage(error: unknown, t: HomeCatalog): string {
  const normalizedError = normalizeApiError(error);

  if (normalizedError.code === 'NETWORK_ERROR' || normalizedError.code === 'TIMEOUT') {
    return t.errors.network;
  }

  if (normalizedError.code === 'UNAUTHORIZED') {
    return t.errors.unauthorized;
  }

  return normalizedError.message || t.errors.generic;
}

export async function getHomeData(authToken: string): Promise<HomeData> {
  const [announcementsResponse, unreadCountResponse] = await Promise.all([
    announcementsService.listRelevantAnnouncements(authToken),
    notificationsService.getUnreadCount(authToken),
  ]);

  return {
    announcements: announcementsResponse.results.map(normalizeAnnouncement),
    unreadNotificationsCount:
      typeof unreadCountResponse.count === 'number' ? unreadCountResponse.count : 0,
  };
}
