import AsyncStorage from '@react-native-async-storage/async-storage';

import { announcementsService as api, normalizeApiError, type PaginatedResult } from '../../../api';
import type { TranslationCatalog } from '../../../i18n';
import type { AnnouncementItem } from '../types';
import { normalizeAnnouncement, parseStoredReadIds } from './announcementModel';

export const ANNOUNCEMENTS_PAGE_SIZE = 15;
export const ANNOUNCEMENTS_READ_STORAGE_KEY = 'panorama_announcements_read_v1';

type AnnouncementsCatalog = TranslationCatalog['announcements'];

export async function loadAnnouncementsPage(
  page: number,
  authToken: string,
): Promise<PaginatedResult<AnnouncementItem>> {
  const response = await api.listRelevantAnnouncements(authToken, {
    page,
    pageSize: ANNOUNCEMENTS_PAGE_SIZE,
  });

  return { ...response, results: response.results.map(normalizeAnnouncement) };
}

export async function loadAnnouncementDetail(
  id: string | number,
  authToken: string,
): Promise<AnnouncementItem> {
  return normalizeAnnouncement(await api.getAnnouncementDetail(id, authToken));
}

export async function readStoredReadIds(): Promise<string[]> {
  try {
    return parseStoredReadIds(await AsyncStorage.getItem(ANNOUNCEMENTS_READ_STORAGE_KEY));
  } catch {
    return [];
  }
}

export async function writeStoredReadIds(ids: string[]): Promise<void> {
  try {
    await AsyncStorage.setItem(ANNOUNCEMENTS_READ_STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Read markers are a convenience; losing them is harmless.
  }
}

export function isAnnouncementNotFound(error: unknown): boolean {
  return normalizeApiError(error).status === 404;
}

export function toSafeAnnouncementsErrorMessage(error: unknown, t: AnnouncementsCatalog): string {
  const normalized = normalizeApiError(error);

  if (normalized.code === 'NETWORK_ERROR' || normalized.code === 'TIMEOUT') {
    return t.errors.network;
  }

  if (normalized.code === 'UNAUTHORIZED') {
    return t.errors.unauthorized;
  }

  return normalized.message || t.errors.generic;
}
