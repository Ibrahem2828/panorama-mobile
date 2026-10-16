import type { Locale } from '../../../i18n';
import { getIntlLocale } from '../../../utils/formatDateTime';

const clockFormatters = new Map<Locale, Intl.DateTimeFormat>();
const dayFormatters = new Map<Locale, Intl.DateTimeFormat>();

function formatterFor(
  cache: Map<Locale, Intl.DateTimeFormat>,
  locale: Locale,
  options: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormat {
  let formatter = cache.get(locale);

  if (!formatter) {
    formatter = new Intl.DateTimeFormat(getIntlLocale(locale), options);
    cache.set(locale, formatter);
  }

  return formatter;
}

/** Short clock time ("09:41 ص"). Formatters are cached: rows call this on every render. */
export function formatMessageClock(value: string, locale: Locale): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return formatterFor(clockFormatters, locale, { hour: '2-digit', minute: '2-digit' }).format(date);
}

/** Full day label for the separators ("الأربعاء، 15 أكتوبر 2026"). */
export function formatMessageDay(date: Date, locale: Locale): string {
  return formatterFor(dayFormatters, locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function formatMegabytes(bytes: number): string {
  return (bytes / (1024 * 1024)).toFixed(1);
}
