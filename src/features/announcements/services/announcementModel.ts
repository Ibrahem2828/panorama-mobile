import type { AnnouncementRecord } from '../../../api';
import type { AcademicTargetKey, AnnouncementItem, AudienceKey } from '../types';

const ENDING_SOON_WINDOW_MS = 48 * 60 * 60 * 1000;
const MAX_REMEMBERED_READ_IDS = 300;

function toText(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

/** Only https links and images are rendered or opened; anything else is dropped. */
export function toSafeExternalUrl(value: unknown): string | null {
  const text = toText(value);

  if (!text) {
    return null;
  }

  try {
    const url = new URL(text);

    return url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

export function normalizeAnnouncement(record: AnnouncementRecord): AnnouncementItem {
  const targets: Array<[AcademicTargetKey, unknown]> = [
    ['university', record.target_university],
    ['faculty', record.target_faculty],
    ['major', record.target_major],
    ['year', record.target_academic_year],
    ['semester', record.target_semester],
  ];

  return {
    id: record.id,
    title: toText(record.title),
    body: toText(record.description) ?? toText(record.body),
    imageUrl: toSafeExternalUrl(record.image),
    linkUrl: toSafeExternalUrl(record.link),
    startsAt: toText(record.starts_at) ?? toText(record.start_date),
    endsAt: toText(record.ends_at) ?? toText(record.end_date),
    createdAt: toText(record.created_at),
    createdByName: toText(record.created_by_name),
    targetUserType: toText(record.target_user_type),
    academicTargets: targets
      .filter(([, value]) => value !== null && value !== undefined)
      .map(([key]) => key),
  };
}

/** Maps the backend `target_user_type` onto a label key. */
export function getAudienceKey(type: string | null | undefined): AudienceKey {
  switch (type) {
    case undefined:
    case null:
    case '':
    case 'all':
      return 'all';
    case 'students':
      return 'students';
    case 'verified_students':
      return 'verified';
    case 'normal_users':
      return 'normal';
    case 'admins':
      return 'admins';
    default:
      return 'custom';
  }
}

/** The moment the announcement became relevant, used for display. */
export function getAnnouncementDate(item: AnnouncementItem): string | null {
  return item.startsAt ?? item.createdAt;
}

export function isEndingSoon(item: AnnouncementItem, now: number = Date.now()): boolean {
  if (!item.endsAt) {
    return false;
  }

  const end = new Date(item.endsAt).getTime();

  return !Number.isNaN(end) && end > now && end - now <= ENDING_SOON_WINDOW_MS;
}

/** Appends a page to the list without ever showing the same announcement twice. */
export function mergeAnnouncementPages(
  current: AnnouncementItem[],
  incoming: AnnouncementItem[],
): AnnouncementItem[] {
  const seen = new Set(current.map((item) => String(item.id)));
  const additions = incoming.filter((item) => {
    const key = String(item.id);

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);

    return true;
  });

  return additions.length > 0 ? [...current, ...additions] : current;
}

/** Newest ids are kept; older ones fall off so storage never grows unbounded. */
export function rememberReadId(readIds: string[], id: string | number): string[] {
  const key = String(id);

  if (readIds.includes(key)) {
    return readIds;
  }

  return [...readIds, key].slice(-MAX_REMEMBERED_READ_IDS);
}

export function parseStoredReadIds(raw: string | null): string[] {
  if (!raw) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(raw);

    return Array.isArray(parsed)
      ? parsed.filter((entry): entry is string => typeof entry === 'string')
      : [];
  } catch {
    return [];
  }
}
