import { academicService, normalizeApiError } from '../../../api';
import { type TranslationCatalog } from '../../../i18n';
import type { CatalogSubject, Id } from '../types';
import { normalizeCatalogDetail, normalizeCatalogSubject } from './subjectsModel';

const SUBJECTS_PAGE_SIZE = 100;
const SUBJECTS_MAX_PAGES = 10;
type SubjectsCatalog = TranslationCatalog['subjects'];

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

/**
 * The whole catalogue of the student's faculty (every year and semester), in the server's order: current-term subjects,
 * then year, semester and name. It is read completely (bounded) so the term, year and search filters work instantly
 * and also on the saved copy when the device is offline.
 */
export async function loadSubjectCatalog(
  authToken: string | null,
): Promise<{ subjects: CatalogSubject[]; count: number }> {
  const subjects: CatalogSubject[] = [];
  let count = 0;

  for (let page = 1; page <= SUBJECTS_MAX_PAGES; page += 1) {
    const response = await academicService.listSubjectCatalog(
      { page, pageSize: SUBJECTS_PAGE_SIZE },
      authToken,
    );

    count = response.count ?? count;
    for (const record of response.results) {
      const subject = normalizeCatalogSubject(record);
      if (subject) subjects.push(subject);
    }

    if (!response.next || response.results.length === 0) {
      break;
    }
  }

  return { subjects, count: Math.max(count, subjects.length) };
}

/** One subject with its full course description. */
export async function loadSubjectDetail(
  subjectId: Id,
  authToken: string | null,
): Promise<CatalogSubject> {
  const subject = normalizeCatalogDetail(
    await academicService.getSubjectCatalogDetail(subjectId, authToken),
  );

  if (!subject) {
    throw new Error('Malformed subject payload');
  }

  return subject;
}
