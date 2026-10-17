import {
  academicService,
  filesService,
  groupsService,
  normalizeApiError,
  searchService as api,
  type FileRecord,
  type GroupRecord,
  type SubjectRecord,
} from '../../../api';
import type { TranslationCatalog } from '../../../i18n';
import type { GlobalSearchResult, SearchResultItem, SearchResultKind } from '../types';
import { EMPTY_SEARCH_RESULT } from '../types';
import { buildTypesParam, clampLimit, normalizeSearchResponse } from './searchModel';

type SearchCatalog = TranslationCatalog['search'];

export type SearchInput = {
  query: string;
  authToken: string;
  isStudent: boolean;
  /** Subjects are faculty-level; the student's major is not needed to search them. */
  facultyId?: string | number | null;
  kinds?: readonly SearchResultKind[];
  limit?: number;
  signal?: AbortSignal;
};

function text(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number') return String(value);
  }
  return '';
}

function subjectItem(record: SubjectRecord): SearchResultItem {
  return {
    id: record.id,
    kind: 'subject',
    title: text(record.name, record.title),
    subtitle: text(record.code, record.description),
  };
}

function groupItem(record: GroupRecord): SearchResultItem {
  return {
    id: record.id,
    kind: 'group',
    title: text(record.name, record.title),
    subtitle: text(record.description),
  };
}

function fileItem(record: FileRecord): SearchResultItem {
  return {
    id: record.id,
    kind: 'file',
    title: text(record.title, record.name),
    subtitle: text(record.file_type, record.description),
  };
}

/**
 * The fallback when the unified search is unavailable: the same lookups stitched from the
 * per-feature lists. Subjects come from the student's faculty, never from a major.
 */
async function runStitchedSearch(input: SearchInput, limit: number): Promise<GlobalSearchResult> {
  const kinds = input.kinds?.length ? input.kinds : (['subject', 'group', 'file'] as const);
  const wants = (kind: SearchResultKind) => kinds.includes(kind);
  const params = { search: input.query, pageSize: limit };
  const jobs: Array<Promise<{ kind: SearchResultKind; items: SearchResultItem[]; count: number }>> =
    [];

  if (wants('file')) {
    jobs.push(
      filesService.listFiles(input.authToken, params).then((r) => ({
        kind: 'file' as const,
        items: r.results.map(fileItem),
        count: r.count,
      })),
    );
  }

  if (input.isStudent && wants('group')) {
    jobs.push(
      groupsService.listAvailableGroups(input.authToken, params).then((r) => ({
        kind: 'group' as const,
        items: r.results.map(groupItem),
        count: r.count,
      })),
    );
  }

  if (input.isStudent && wants('subject') && input.facultyId != null) {
    jobs.push(
      academicService
        .listSubjectsForFaculty(input.facultyId, params, input.authToken)
        .then((r) => ({
          kind: 'subject' as const,
          items: r.results.map(subjectItem),
          count: r.count,
        })),
    );
  }

  const settled = await Promise.allSettled(jobs);
  const result: GlobalSearchResult = {
    ...EMPTY_SEARCH_RESULT,
    counts: { ...EMPTY_SEARCH_RESULT.counts },
  };

  for (const entry of settled) {
    if (entry.status === 'rejected') {
      result.partialFailure = true;
      continue;
    }

    const { kind, items, count } = entry.value;
    const key = kind === 'subject' ? 'subjects' : kind === 'group' ? 'groups' : 'files';

    result[key] = items;
    result.counts[kind] = Math.max(count, items.length);
    result.total += result.counts[kind];
  }

  if (result.partialFailure && result.total === 0) {
    const failure = settled.find((entry) => entry.status === 'rejected');

    if (failure?.status === 'rejected') throw failure.reason;
  }

  return result;
}

function shouldFallBack(error: unknown): boolean {
  const normalized = normalizeApiError(error);

  // Connectivity and session problems would fail the fallback too; everything else (for
  // example a search service that is down) is worth a second path.
  return !['NETWORK_ERROR', 'TIMEOUT', 'UNAUTHORIZED', 'FORBIDDEN'].includes(normalized.code);
}

export async function runGlobalSearch(input: SearchInput): Promise<GlobalSearchResult> {
  const limit = clampLimit(input.limit ?? 5);

  try {
    return normalizeSearchResponse(
      await api.unifiedSearch(
        { q: input.query, types: buildTypesParam(input.kinds ?? []), limit },
        input.authToken,
        input.signal,
      ),
    );
  } catch (error) {
    if (input.signal?.aborted || !shouldFallBack(error)) {
      throw error;
    }

    return runStitchedSearch(input, limit);
  }
}

export function toSafeSearchErrorMessage(error: unknown, t: SearchCatalog): string {
  const normalized = normalizeApiError(error);
  if (normalized.code === 'NETWORK_ERROR' || normalized.code === 'TIMEOUT') {
    return t.errors.network;
  }
  if (normalized.code === 'UNAUTHORIZED') return t.errors.unauthorized;
  return normalized.message || t.errors.generic;
}
