import type { GlobalSearchResult, SearchResultItem, SearchResultKind } from '../types';
import { EMPTY_SEARCH_RESULT, SEARCH_KINDS } from '../types';

export const MIN_QUERY_LENGTH = 2;
export const MAX_QUERY_LENGTH = 50;
export const DEFAULT_LIMIT = 5;
export const MAX_LIMIT = 20;
export const LIMIT_STEP = 5;

/** Response keys of the unified search, per result kind. Lectures are not offered here yet. */
const RESPONSE_KEY: Record<SearchResultKind, string> = {
  subject: 'subjects',
  group: 'groups',
  file: 'files',
  announcement: 'announcements',
};

type Rec = Record<string, unknown>;

function isRecord(value: unknown): value is Rec {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function text(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }

  return '';
}

/** Trim like the backend and check the 2..50 character window. */
export function searchQueryState(raw: string) {
  const query = raw.trim();

  return {
    query,
    valid: query.length >= MIN_QUERY_LENGTH && query.length <= MAX_QUERY_LENGTH,
    tooShort: query.length > 0 && query.length < MIN_QUERY_LENGTH,
    tooLong: query.length > MAX_QUERY_LENGTH,
  };
}

export function clampLimit(limit: number): number {
  if (!Number.isFinite(limit)) return DEFAULT_LIMIT;

  return Math.min(MAX_LIMIT, Math.max(1, Math.trunc(limit)));
}

/** `types` value for the request: omitted when every offered kind is wanted. */
export function buildTypesParam(kinds: readonly SearchResultKind[]): string | undefined {
  const wanted = SEARCH_KINDS.filter((kind) => kinds.includes(kind));
  const list = wanted.length > 0 ? wanted : SEARCH_KINDS;

  // Always name the types: the backend also returns lectures, which this app cannot open yet.
  return list.map((kind) => RESPONSE_KEY[kind]).join(',');
}

function toItem(kind: SearchResultKind, raw: unknown): SearchResultItem | null {
  if (!isRecord(raw)) return null;

  const id =
    typeof raw.id === 'number'
      ? raw.id
      : typeof raw.id === 'string' && /^\d+$/u.test(raw.id)
        ? raw.id
        : null;

  if (id === null) return null;

  switch (kind) {
    case 'subject':
      return {
        id,
        kind,
        title: text(raw.name),
        subtitle: [text(raw.code), text(raw.academic_year), text(raw.semester)]
          .filter(Boolean)
          .join(' · '),
      };
    case 'group':
      return { id, kind, title: text(raw.name), subtitle: text(raw.description) };
    case 'file':
      return {
        id,
        kind,
        title: text(raw.title),
        subtitle: [text(raw.subject_name), text(raw.file_type).toUpperCase()]
          .filter(Boolean)
          .join(' · '),
        inGroup: raw.group_id !== null && raw.group_id !== undefined,
      };
    case 'announcement':
      return { id, kind, title: text(raw.title), subtitle: text(raw.description) };
  }
}

/** Defensive parse of the unified payload; counts fall back to the number of returned hits. */
export function normalizeSearchResponse(data: unknown): GlobalSearchResult {
  const source = isRecord(data) ? data : {};
  const rawCounts = isRecord(source.counts) ? source.counts : {};
  const result: GlobalSearchResult = {
    ...EMPTY_SEARCH_RESULT,
    counts: { ...EMPTY_SEARCH_RESULT.counts },
  };

  for (const kind of SEARCH_KINDS) {
    const key = RESPONSE_KEY[kind];
    const list = Array.isArray(source[key]) ? (source[key] as unknown[]) : [];
    const items = list
      .map((entry) => toItem(kind, entry))
      .filter((x): x is SearchResultItem => !!x);
    const declared = rawCounts[key];
    const count =
      typeof declared === 'number' && Number.isFinite(declared) && declared >= items.length
        ? declared
        : items.length;

    result[`${key}` as 'subjects' | 'groups' | 'files' | 'announcements'] = items;
    result.counts[kind] = count;
    result.total += count;
  }

  return result;
}

/** Whether "show more" can reveal more hits of a kind. */
export function canShowMore(result: GlobalSearchResult, kind: SearchResultKind, limit: number) {
  const shown = result[RESPONSE_KEY[kind] as 'subjects'].length;

  return limit < MAX_LIMIT && result.counts[kind] > shown;
}
