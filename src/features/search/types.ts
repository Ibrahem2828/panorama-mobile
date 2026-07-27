import type { EntityId } from '../../api';

export type SearchResultKind = 'subject' | 'group' | 'file';

export type SearchResultItem = {
  id: EntityId;
  kind: SearchResultKind;
  title: string;
  subtitle: string;
};

export type GlobalSearchResult = {
  subjects: SearchResultItem[];
  groups: SearchResultItem[];
  files: SearchResultItem[];
  total: number;
  partialFailure: boolean;
};
