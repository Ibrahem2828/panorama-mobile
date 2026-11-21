import { getCacheScope } from './cacheScope';
import { filterByLocalQuery, recordsOf, uniqueById } from './localSearch';
import { readCachedByPath } from './responseCache';

type Rec = Record<string, unknown> & { id: string | number };

function hasId(record: Record<string, unknown>): record is Rec {
  return typeof record.id === 'number' || typeof record.id === 'string';
}

/** Every record of the lists already saved for the signed-in user under paths matching `pattern`, without duplicates. */
export async function readCachedRecords(pattern: string | RegExp): Promise<Rec[]> {
  const scope = getCacheScope();

  if (!scope) {
    return [];
  }

  const entries = await readCachedByPath<unknown>(scope, pattern);

  return uniqueById(entries.flatMap((entry) => recordsOf(entry.data).filter(hasId)));
}

/** The saved records whose given fields match the query (see `matchesLocalQuery`). */
export async function searchCachedRecords(
  pattern: string | RegExp,
  query: string,
  fields: readonly string[],
): Promise<Rec[]> {
  const records = await readCachedRecords(pattern);

  return filterByLocalQuery(records, query, (record) =>
    fields.map((field) => {
      // `brand.name` reads a nested field.
      const value = field
        .split('.')
        .reduce<unknown>(
          (current, part) =>
            current && typeof current === 'object'
              ? (current as Record<string, unknown>)[part]
              : undefined,
          record,
        );

      return typeof value === 'string' ? value : typeof value === 'number' ? String(value) : '';
    }),
  );
}
