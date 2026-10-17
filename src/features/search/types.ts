import type { EntityId } from '../../api';

export const SEARCH_KINDS = ['subject', 'group', 'file', 'announcement'] as const;

export type SearchResultKind = (typeof SEARCH_KINDS)[number];

export type SearchResultItem = {
  id: EntityId;
  kind: SearchResultKind;
  title: string;
  subtitle: string;
  /** A file that lives in a group rather than in the general library. */
  inGroup?: boolean;
};

export type GlobalSearchResult = {
  subjects: SearchResultItem[];
  groups: SearchResultItem[];
  files: SearchResultItem[];
  announcements: SearchResultItem[];
  /** How many matches exist per kind (can exceed what was returned). */
  counts: Record<SearchResultKind, number>;
  total: number;
  partialFailure: boolean;
};

export const EMPTY_SEARCH_RESULT: GlobalSearchResult = {
  subjects: [],
  groups: [],
  files: [],
  announcements: [],
  counts: { subject: 0, group: 0, file: 0, announcement: 0 },
  total: 0,
  partialFailure: false,
};
