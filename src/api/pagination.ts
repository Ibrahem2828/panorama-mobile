import type { ApiQueryParams } from './request';

export type PaginatedResult<TItem> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: TItem[];
};

export type PaginationParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  ordering?: string;
};

export function buildQueryString(query?: ApiQueryParams): string {
  if (!query) {
    return '';
  }

  const pairs = Object.entries(query)
    .filter((entry): entry is [string, string | number | boolean] => {
      const value = entry[1];

      return value !== null && value !== undefined && value !== '';
    })
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);

  return pairs.length > 0 ? `?${pairs.join('&')}` : '';
}

export function toPaginationQuery(params?: PaginationParams): ApiQueryParams {
  return {
    page: params?.page,
    page_size: params?.pageSize,
    search: params?.search,
    ordering: params?.ordering,
  };
}
