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

function normalizeSubject(record: SubjectRecord): SearchResultItem {
  return {
    id: record.id,
    kind: 'subject',
    title: text(record.name, record.title) || 'مادة بدون اسم',
    subtitle: text(record.code, record.description) || 'مادة دراسية',
  };
}

function normalizeGroup(record: GroupRecord): SearchResultItem {
  return {
    id: record.id,
    kind: 'group',
    title: text(record.name, record.title) || 'مجموعة بدون اسم',
    subtitle: text(record.description) || 'مجموعة أكاديمية',
  };
}

function normalizeFile(record: FileRecord): SearchResultItem {
  return {
    id: record.id,
    kind: 'file',
    title: text(record.title, record.name) || 'ملف بدون عنوان',
    subtitle: text(record.file_type, record.description) || 'ملف متاح داخل التطبيق',
  };
}

export async function runGlobalSearch(input: SearchInput): Promise<GlobalSearchResult> {
  const query = input.query.trim();
  if (query.length < 2) {
    return { subjects: [], groups: [], files: [], total: 0, partialFailure: false };
  }

  const requests: Array<
    Promise<{ kind: 'subjects' | 'groups' | 'files'; items: SearchResultItem[] }>
  > = [
    filesService
      .listFiles(input.authToken, { search: query, pageSize: 10 })
      .then((response) => ({ kind: 'files' as const, items: response.results.map(normalizeFile) })),
  ];

  if (input.isStudent) {
    requests.push(
      groupsService
        .listAvailableGroups(input.authToken, { search: query, pageSize: 10 })
        .then((response) => ({
          kind: 'groups' as const,
          items: response.results.map(normalizeGroup),
        })),
    );
    if (input.majorId != null) {
      requests.push(
        academicService
          .listSubjectsForMajor(input.majorId, { search: query, pageSize: 10 }, input.authToken)
          .then((response) => ({
            kind: 'subjects' as const,
            items: response.results.map(normalizeSubject),
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

export function toSafeSearchErrorMessage(error: unknown): string {
  const normalized = normalizeApiError(error);
  if (normalized.code === 'NETWORK_ERROR' || normalized.code === 'TIMEOUT') {
    return 'تعذر البحث بسبب الاتصال. حاول مرة أخرى.';
  }
  if (normalized.code === 'UNAUTHORIZED') return 'انتهت الجلسة. يرجى تسجيل الدخول مجددًا.';
  return normalized.message || 'تعذر إتمام البحث حاليًا.';
}
