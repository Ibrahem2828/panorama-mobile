import { apiClient } from '../client';
import { endpoints } from '../endpoints';

export type UnifiedSearchParams = {
  q: string;
  /** Comma separated result types; omitted means every type. */
  types?: string;
  limit?: number;
};

/** One request that searches every content type the account may see. */
export function unifiedSearch(
  params: UnifiedSearchParams,
  authToken: string,
  signal?: AbortSignal,
): Promise<unknown> {
  return apiClient.get<unknown>(endpoints.search, {
    authToken,
    signal,
    query: { q: params.q, types: params.types, limit: params.limit },
  });
}
