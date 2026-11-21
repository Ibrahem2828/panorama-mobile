import { normalizeSearchText } from '../components/forms/searchText';

/**
 * Pure matching for searching what is on the phone while there is no connection. It folds text the way the rest of the app does
 * (`normalizeSearchText`: no diacritics or tatweel, alef/ya/ta marbuta unified, case-insensitive) and adds the hamza carriers and
 * Arabic-Indic digits, so «سوال» finds «سؤال», «٣» finds «3» and «اداره» finds «الإدارة».
 */

const ARABIC_INDIC_ZERO = 0x0660;
const EXTENDED_ARABIC_INDIC_ZERO = 0x06f0;

export function normalizeLocalSearchText(value: string | null | undefined): string {
  if (!value) {
    return '';
  }

  return normalizeSearchText(value)
    .replace(/[٠-٩]/gu, (digit) => String(digit.charCodeAt(0) - ARABIC_INDIC_ZERO))
    .replace(/[۰-۹]/gu, (digit) => String(digit.charCodeAt(0) - EXTENDED_ARABIC_INDIC_ZERO))
    .replace(/ؤ/gu, 'و')
    .replace(/ئ/gu, 'ي')
    .replace(/[\s\p{Cf}]+/gu, ' ')
    .trim();
}

export function localSearchTokens(query: string): string[] {
  const normalized = normalizeLocalSearchText(query);

  return normalized ? normalized.split(' ') : [];
}

/** Every word of the query must appear (as part of a word) in the text: «تحليل رياضيات» finds «رياضيات: تحليل 1». */
export function matchesLocalQuery(
  text: string | readonly (string | null | undefined)[],
  query: string,
): boolean {
  const tokens = localSearchTokens(query);

  if (tokens.length === 0) {
    return false;
  }

  const haystack = normalizeLocalSearchText(
    Array.isArray(text) ? text.join(' ') : (text as string),
  );

  return tokens.every((token) => haystack.includes(token));
}

/**
 * Keeps the items that match, best first (the text starts with the query, then a word starts with it, then anywhere), keeping the
 * original order inside one rank. Returns `[]` for a query with no usable word.
 */
export function filterByLocalQuery<T>(
  items: readonly T[],
  query: string,
  getText: (item: T) => string | readonly (string | null | undefined)[],
): T[] {
  const normalizedQuery = normalizeLocalSearchText(query);

  if (!normalizedQuery) {
    return [];
  }

  const ranked: { item: T; rank: number; index: number }[] = [];

  items.forEach((item, index) => {
    const text = getText(item);

    if (!matchesLocalQuery(text, query)) {
      return;
    }

    const haystack = normalizeLocalSearchText(
      Array.isArray(text) ? text.join(' ') : (text as string),
    );
    const rank = haystack.startsWith(normalizedQuery)
      ? 0
      : haystack.includes(` ${normalizedQuery}`)
        ? 1
        : 2;

    ranked.push({ item, rank, index });
  });

  return ranked
    .sort((left, right) => left.rank - right.rank || left.index - right.index)
    .map(({ item }) => item);
}

/** Keeps the first item per id (lists saved under different queries overlap). */
export function uniqueById<T extends { id: string | number }>(items: readonly T[]): T[] {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = String(item.id);

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);

    return true;
  });
}

/** The records of a saved list answer, whatever shape it had (`{results: []}` or a bare array). */
export function recordsOf(data: unknown): Record<string, unknown>[] {
  const list = Array.isArray(data)
    ? data
    : data && typeof data === 'object' && Array.isArray((data as { results?: unknown }).results)
      ? (data as { results: unknown[] }).results
      : [];

  return list.filter(
    (entry): entry is Record<string, unknown> =>
      typeof entry === 'object' && entry !== null && !Array.isArray(entry),
  );
}

/**
 * Whether a failed search should be answered from what is on the phone: the device is offline or the server cannot be
 * reached. Any other failure (a session problem, a server refusal) keeps its own message.
 */
export function shouldSearchLocally(input: {
  isOnline: boolean;
  errorCode?: string;
  status?: number;
}): boolean {
  if (!input.isOnline) {
    return true;
  }

  return (
    input.errorCode === 'NETWORK_ERROR' ||
    input.errorCode === 'TIMEOUT' ||
    (input.status !== undefined && input.status >= 500)
  );
}
