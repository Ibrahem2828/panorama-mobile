import type { Locale } from '../i18n';

/**
 * BCP 47 tags for `toLocale*String`. Kept in one place because a hardcoded 'ar-SY' had
 * already been copied into four screens and the printing service, which meant an English
 * user still read Arabic dates.
 */
const INTL_LOCALES: Record<Locale, string> = { ar: 'ar-SY', en: 'en-GB' };

export function getIntlLocale(locale: Locale): string {
  return INTL_LOCALES[locale];
}

export function formatDate(
  value: string | null | undefined,
  locale: Locale,
  options?: Intl.DateTimeFormatOptions,
): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? null
    : date.toLocaleDateString(INTL_LOCALES[locale], options);
}

export function formatTime(value: string | null | undefined, locale: Locale): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toLocaleTimeString(INTL_LOCALES[locale]);
}

export function formatDateTime(value: string | null | undefined, locale: Locale): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toLocaleString(INTL_LOCALES[locale]);
}
