import type { Locale, TranslationCatalog } from '../i18n';
import { formatDate } from './formatDateTime';

const WEEK_IN_DAYS = 7;

/**
 * Relative wording up to a week old, then an absolute date. Both follow the active
 * locale — the absolute fallback used to be pinned to 'ar-SY', which lint caught here
 * because `locale` was threaded in but never read.
 */
export function formatRelativeDate(
  value: string | null | undefined,
  t: TranslationCatalog['relativeTime'],
  locale: Locale,
): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const diffMinutes = Math.floor((Date.now() - date.getTime()) / 60_000);

  if (diffMinutes < 1) {
    return t.now;
  }

  if (diffMinutes < 60) {
    return t.minutesAgo(diffMinutes);
  }

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) {
    return t.hoursAgo(diffHours);
  }

  const diffDays = Math.floor(diffHours / 24);

  if (diffDays < WEEK_IN_DAYS) {
    return t.daysAgo(diffDays);
  }

  return formatDate(value, locale);
}
