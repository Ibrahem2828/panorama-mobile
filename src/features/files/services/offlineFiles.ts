import { searchCachedRecords } from '../../../offline/cachedRecords';
import { filterByLocalQuery, uniqueById } from '../../../offline/localSearch';
import { entryKind, type OfflineEntry } from '../../lectures/offline/licenseLogic';
import type { FileResource } from '../types';

const FILE_LISTS = /^\/api\/v1\/(?:files|groups\/\d+\/files)\/$/u;

/**
 * Library files that match a search typed while offline: the file lists already saved on the phone, plus the files downloaded
 * for offline study (matched by title). The saved list wins when both know the same file because it carries more details.
 */
export async function searchLocalFiles(
  query: string,
  entries: Readonly<Record<string, OfflineEntry>>,
): Promise<FileResource[]> {
  const cached = (await searchCachedRecords(FILE_LISTS, query, [
    'title',
    'name',
  ])) as FileResource[];
  const downloaded = filterByLocalQuery(
    Object.values(entries).filter(
      (entry) => entry.status === 'complete' && entryKind(entry) === 'file',
    ),
    query,
    (entry) => [entry.title, entry.subjectName],
  ).map((entry): FileResource => ({ id: entry.lectureId, title: entry.title, file_type: 'pdf' }));

  return uniqueById([...cached, ...downloaded]);
}
