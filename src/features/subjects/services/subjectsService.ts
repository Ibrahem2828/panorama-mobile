import {
  academicService,
  normalizeApiError,
  type PaginatedResult,
  type SubjectRecord,
} from '../../../api';
import type { Id, Subject } from '../types';
import type { TranslationCatalog } from '../../../i18n';

const SUBJECTS_PAGE_SIZE = 100;
const SUBJECTS_MAX_PAGES = 10;
type SubjectsCatalog = TranslationCatalog['subjects'];

export type LoadSubjectsInput = {
  facultyId: Id;
  /** Optional specialization tag: when set the backend also returns the faculty-wide subjects. */
  majorId?: Id | null;
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

export type SubjectMeta = {
  credits: string | null;
  category: string | null;
  englishName: string | null;
};

/** Imported descriptions look like "3 ساعات معتمدة · متطلب كلية · Algorithms and Data Structures 1". */
export function parseSubjectMeta(subject: Subject): SubjectMeta {
  const description = toText(subject.description);
  if (!description) {
    return { credits: null, category: null, englishName: null };
  }
  const parts = description.split(' · ').map((part) => part.trim());
  if (parts.length < 3) {
    return { credits: null, category: null, englishName: null };
  }
  return { credits: parts[0] || null, category: parts[1] || null, englishName: parts[2] || null };
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

// Subjects belong to the faculty (a major is only an optional tag), so a student can browse and retake any year or semester.
export async function loadSubjectsForFaculty(
  input: LoadSubjectsInput,
): Promise<PaginatedResult<Subject>> {
  const results: Subject[] = [];
  let count = 0;

  for (let page = 1; page <= SUBJECTS_MAX_PAGES; page += 1) {
    const response = await academicService.listSubjectsForFaculty(
      input.facultyId,
      {
        page,
        pageSize: SUBJECTS_PAGE_SIZE,
        academic_year: input.academicYearId ?? undefined,
        semester: input.semesterId ?? undefined,
        major: input.majorId ?? undefined,
        search: input.search,
        // Subjects have no `order` column; the backend's OrderingFilter 500s if it is requested.
        ordering: 'name',
      },
      input.authToken,
    );

    count = response.count ?? count;
    results.push(...response.results.map(normalizeSubject));

    if (!response.next || response.results.length === 0) {
      break;
    }
  }

  return { count: count || results.length, next: null, previous: null, results };
}
