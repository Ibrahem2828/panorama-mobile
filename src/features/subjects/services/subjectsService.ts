import {
  academicService,
  normalizeApiError,
  type PaginatedResult,
  type SubjectRecord,
} from '../../../api';
import type { Id, Subject } from '../types';
import type { TranslationCatalog } from '../../../i18n';

const SUBJECTS_PAGE_SIZE = 500;
type SubjectsCatalog = TranslationCatalog['subjects'];

export type LoadSubjectsInput = {
  majorId: Id;
  academicYearId?: Id | null;
  semesterId?: Id | null;
  search?: string;
  authToken?: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toText(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }

  if (typeof value === 'number') {
    return String(value);
  }

  return undefined;
}

function toCount(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function toRelation(value: unknown): Id | Record<string, unknown> | null {
  if (typeof value === 'string' || typeof value === 'number' || isRecord(value)) {
    return value;
  }

  return null;
}

function normalizeSubject(record: SubjectRecord): Subject {
  return {
    ...record,
    id: record.id,
    name: toText(record.name),
    title: toText(record.title),
    code: toText(record.code),
    description: toText(record.description) ?? null,
    major: toRelation(record.major),
    academic_year: toRelation(record.academic_year),
    semester: toRelation(record.semester),
    order: toCount(record.order),
    created_at: toText(record.created_at),
    updated_at: toText(record.updated_at),
    files_count: toCount(record.files_count),
    groups_count: toCount(record.groups_count),
    lectures_count: toCount(record.lectures_count),
  };
}

export function toSafeSubjectsErrorMessage(error: unknown, t: SubjectsCatalog): string {
  const normalizedError = normalizeApiError(error);

  if (normalizedError.code === 'NETWORK_ERROR' || normalizedError.code === 'TIMEOUT') {
    return t.errors.network;
  }

  if (normalizedError.code === 'UNAUTHORIZED') {
    return t.errors.unauthorized;
  }

  return normalizedError.message || t.errors.generic;
}

export function getSubjectDisplayName(subject: Subject, t: SubjectsCatalog): string {
  return toText(subject.name) ?? toText(subject.title) ?? t.untitled;
}

export function getSubjectCode(subject: Subject): string | null {
  return toText(subject.code) ?? null;
}

export function getSubjectDescription(subject: Subject): string | null {
  return toText(subject.description) ?? null;
}

export function getEntityLabel(value: unknown): string | null {
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }

  if (!isRecord(value)) {
    return null;
  }

  return (
    toText(value.name) ??
    toText(value.title) ??
    toText(value.label) ??
    toText(value.code) ??
    toText(value.id) ??
    null
  );
}

export function filterSubjectsBySearch(
  subjects: Subject[],
  search: string,
  t: SubjectsCatalog,
): Subject[] {
  const query = search.trim().toLocaleLowerCase();

  if (!query) {
    return subjects;
  }

  return subjects.filter((subject) => {
    const searchableText = [
      getSubjectDisplayName(subject, t),
      getSubjectCode(subject),
      getSubjectDescription(subject),
    ]
      .filter((value): value is string => Boolean(value))
      .join(' ')
      .toLocaleLowerCase();

    return searchableText.includes(query);
  });
}

export async function loadSubjectsForMajor(
  input: LoadSubjectsInput,
): Promise<PaginatedResult<Subject>> {
  const response = await academicService.listSubjectsForMajor(
    input.majorId,
    {
      pageSize: SUBJECTS_PAGE_SIZE,
      academic_year: input.academicYearId ?? undefined,
      semester: input.semesterId ?? undefined,
      search: input.search,
      ordering: 'order,name',
    },
    input.authToken,
  );

  return {
    ...response,
    results: response.results.map(normalizeSubject),
  };
}
