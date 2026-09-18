import { formatDate, formatTime, getIntlLocale } from '../formatDateTime';

/**
 * Dates were formatted with a hardcoded 'ar-SY' in five places, so an English user still
 * read Arabic dates. These assert the locale is actually honoured, and that bad input
 * returns null instead of "Invalid Date".
 */
describe('locale-aware date and time formatting', () => {
  const iso = '2026-03-05T14:30:00.000Z';

  it('maps each app locale to a BCP 47 tag', () => {
    expect(getIntlLocale('ar')).toBe('ar-SY');
    expect(getIntlLocale('en')).toBe('en-GB');
  });

  it('formats the same instant differently per locale', () => {
    expect(formatDate(iso, 'ar')).not.toBe(formatDate(iso, 'en'));
  });

  it('formats an English date as day/month/year', () => {
    expect(formatDate(iso, 'en')).toBe('05/03/2026');
  });

  it('returns null for missing values rather than a placeholder string', () => {
    expect(formatDate(null, 'ar')).toBeNull();
    expect(formatDate(undefined, 'en')).toBeNull();
    expect(formatTime('', 'ar')).toBeNull();
  });

  it('returns null for an unparseable value instead of "Invalid Date"', () => {
    expect(formatDate('not-a-date', 'en')).toBeNull();
    expect(formatTime('not-a-date', 'ar')).toBeNull();
  });
});
