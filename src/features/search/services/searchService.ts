import {
  academicService,
  filesService,
  groupsService,
  normalizeApiError,
  type FileRecord,
  type GroupRecord,
  type SubjectRecord,
} from '../../../api';
import type { GlobalSearchResult, SearchResultItem } from '../types';
import type { TranslationCatalog } from '../../../i18n';

type SearchCatalog = TranslationCatalog['search'];

type SearchInput = {
  query: string;
  authToken: string;
  isStudent: boolean;
  majorId?: string | number | null;
};

function text(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number') return String(value);
  }
  return '';
}

function normalizeSubject(record: SubjectRecord, t: SearchCatalog): SearchResultItem {
  return {
    id: record.id,
    kind: 'subject',
    title: text(record.name, record.title) || t.untitledSubject,
    subtitle: text(record.code, record.description) || t.subjectSubtitle,
  };
}

function normalizeGroup(record: GroupRecord, t: SearchCatalog): SearchResultItem {
  return {
    id: record.id,
    kind: 'group',
    title: text(record.name, record.title) || t.untitledGroup,
    subtitle: text(record.description) || t.groupSubtitle,
  };
}

function normalizeFile(record: FileRecord, t: SearchCatalog): SearchResultItem {
  return {
    id: record.id,
    kind: 'file',
    title: text(record.title, record.name) || t.untitledFile,
    subtitle: text(record.file_type, record.description) || t.fileSubtitle,
  };
}

export async function runGlobalSearch(
  input: SearchInput,
  t: SearchCatalog,
): Promise<GlobalSearchResult> {
  const query = input.query.trim();
  if (query.length < 2) {
    return { subjects: [], groups: [], files: [], total: 0, partialFailure: false };
  }

  const requests: Array<
    Promise<{ kind: 'subjects' | 'groups' | 'files'; items: SearchResultItem[] }>
  > = [
    filesService.listFiles(input.authToken, { search: query, pageSize: 10 }).then((response) => ({
      kind: 'files' as const,
      items: response.results.map((record) => normalizeFile(record, t)),
    })),
  ];

  if (input.isStudent) {
    requests.push(
      groupsService
        .listAvailableGroups(input.authToken, { search: query, pageSize: 10 })
        .then((response) => ({
          kind: 'groups' as const,
          items: response.results.map((record) => normalizeGroup(record, t)),
        })),
    );
    if (input.majorId != null) {
      requests.push(
        academicService
          .listSubjectsForMajor(input.majorId, { search: query, pageSize: 10 }, input.authToken)
          .then((response) => ({
            kind: 'subjects' as const,
            items: response.results.map((record) => normalizeSubject(record, t)),
          })),
      );
    }
  }

  const settled = await Promise.allSettled(requests);
  const result: GlobalSearchResult = {
    subjects: [],
    groups: [],
    files: [],
    total: 0,
    partialFailure: false,
  };

  for (const entry of settled) {
    if (entry.status === 'rejected') {
      result.partialFailure = true;
      continue;
    }
    result[entry.value.kind] = entry.value.items;
    result.total += entry.value.items.length;
  }

  if (result.partialFailure && result.total === 0) {
    const firstFailure = settled.find((entry) => entry.status === 'rejected');
    if (firstFailure?.status === 'rejected') throw firstFailure.reason;
  }

  return result;
}

export function toSafeSearchErrorMessage(error: unknown, t: SearchCatalog): string {
  const normalized = normalizeApiError(error);
  if (normalized.code === 'NETWORK_ERROR' || normalized.code === 'TIMEOUT') {
    return t.errors.network;
  }
  if (normalized.code === 'UNAUTHORIZED') return t.errors.unauthorized;
  return normalized.message || t.errors.generic;
}
