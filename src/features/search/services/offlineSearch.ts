import { searchCachedRecords } from '../../../offline/cachedRecords';
import { filterByLocalQuery } from '../../../offline/localSearch';
import { entryKind, type OfflineEntry } from '../../lectures/offline/licenseLogic';
import type { GlobalSearchResult, SearchResultKind } from '../types';
import { normalizeSearchResponse } from './searchModel';

/** A lecture or file saved on the phone whose title matches the query. */
export type DownloadedHit = {
  kind: 'file' | 'lecture';
  id: number;
  title: string;
  subjectName: string | null;
};

const SUBJECT_LISTS = /^\/api\/v1\/(?:subjects|faculties\/\d+\/subjects|majors\/\d+\/subjects)\/$/u;
const FILE_LISTS = /^\/api\/v1\/(?:files|groups\/\d+\/files)\/$/u;
const ANNOUNCEMENT_LISTS = /^\/api\/v1\/announcements\/$/u;

/** Saved lectures and files (a complete copy only) whose title or subject matches. Pure: the caller passes the inventory. */
export function searchDownloadedEntries(
  entries: Readonly<Record<string, OfflineEntry>> | readonly OfflineEntry[],
  query: string,
  kinds: readonly SearchResultKind[] = [],
): DownloadedHit[] {
  if (kinds.length > 0 && !kinds.includes('file')) {
    return [];
  }

  const complete = (Array.isArray(entries) ? [...entries] : Object.values(entries)).filter(
    (entry): entry is OfflineEntry => (entry as OfflineEntry).status === 'complete',
  );

  return filterByLocalQuery(complete, query, (entry) => [entry.title, entry.subjectName]).map(
    (entry) => ({
      kind: entryKind(entry),
      id: entry.lectureId,
      title: entry.title,
      subjectName: entry.subjectName,
    }),
  );
}

/**
 * The global search answered from the lists the student already loaded (subjects, library files, announcements), in the same
 * shape the server answer has. Never throws: with nothing saved the result is simply empty.
 */
export async function searchCachedLists(
  query: string,
  kinds: readonly SearchResultKind[] = [],
  limit = 20,
): Promise<GlobalSearchResult> {
  const wants = (kind: SearchResultKind) => kinds.length === 0 || kinds.includes(kind);
  const [subjects, files, announcements] = await Promise.all([
    wants('subject') ? searchCachedRecords(SUBJECT_LISTS, query, ['name', 'title', 'code']) : [],
    wants('file') ? searchCachedRecords(FILE_LISTS, query, ['title', 'name']) : [],
    wants('announcement')
      ? searchCachedRecords(ANNOUNCEMENT_LISTS, query, ['title', 'description'])
      : [],
  ]);

  return normalizeSearchResponse({
    subjects: subjects.slice(0, limit),
    files: files.slice(0, limit),
    announcements: announcements.slice(0, limit),
    counts: {
      subjects: subjects.length,
      files: files.length,
      announcements: announcements.length,
    },
  });
}
