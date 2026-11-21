import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  storeService,
  type StoreBrand,
  type StoreCategory,
  type StoreProductCard,
} from '../../../api';
import { normalizeApiError } from '../../../api';
import { searchCachedRecords } from '../../../offline/cachedRecords';
import { shouldSearchLocally } from '../../../offline/localSearch';
import { useNetworkStore } from '../../../offline/networkStore';
import { useAuthStore } from '../../auth/store';
import type { StoreFilters } from '../components/FilterSheet';
import { buildProductsQuery } from '../services/storeQuery';
import { useStoreStore } from '../store';

const SEARCH_DEBOUNCE_MS = 400;

type CatalogState = {
  items: StoreProductCard[];
  count: number;
  nextPage: number | null;
  isLoading: boolean;
  isLoadingMore: boolean;
  isRefreshing: boolean;
  /** The failure of the first page (the list is replaced by an error state). */
  error: unknown;
  /** The failure of a later page (a retry row under the list). */
  moreError: unknown;
  hasLoaded: boolean;
  /** A search answered from the products already saved on the phone (no connection). */
  isLocal: boolean;
};

const EMPTY: CatalogState = {
  items: [],
  count: 0,
  nextPage: null,
  isLoading: true,
  isLoadingMore: false,
  isRefreshing: false,
  error: null,
  moreError: null,
  hasLoaded: false,
  isLocal: false,
};

/** Brands and categories for the strip and the filter sheet; a failure just hides them. */
export function useStoreFilterOptions() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [brands, setBrands] = useState<StoreBrand[]>([]);
  const [categories, setCategories] = useState<StoreCategory[]>([]);

  const load = useCallback(async () => {
    if (!accessToken) return;
    const [brandList, categoryList] = await Promise.allSettled([
      storeService.listBrands(accessToken),
      storeService.listCategories(accessToken),
    ]);
    if (brandList.status === 'fulfilled' && Array.isArray(brandList.value)) {
      setBrands(brandList.value);
    }
    if (categoryList.status === 'fulfilled' && Array.isArray(categoryList.value)) {
      setCategories(categoryList.value);
    }
  }, [accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  return { brands, categories, reload: load };
}

/**
 * The product grid's data: first page, "load more", pull to refresh. Search waits for the student to stop typing, and only
 * the newest request may answer (an older, slower one is ignored).
 */
export function useStoreCatalog(search: string, filters: StoreFilters) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const currency = useStoreStore((state) => state.currency);
  const [state, setState] = useState<CatalogState>(EMPTY);
  const requestId = useRef(0);
  const [debounced, setDebounced] = useState(search);

  useEffect(() => {
    // Clearing the field applies at once; typing waits.
    if (search.trim() === '') {
      setDebounced('');
      return undefined;
    }
    const timer = setTimeout(() => setDebounced(search), SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [search]);

  const query = useMemo(
    () => buildProductsQuery({ search: debounced, filters, currency }),
    [debounced, filters, currency],
  );

  const fetchFirst = useCallback(
    async (mode: 'initial' | 'refresh') => {
      if (!accessToken) return;
      const id = ++requestId.current;
      setState((previous) =>
        mode === 'refresh'
          ? { ...previous, isRefreshing: true, error: null }
          : { ...EMPTY, items: previous.items, isLoading: true },
      );
      try {
        const page = await storeService.listProducts({ ...query, page: 1 }, accessToken);
        if (id !== requestId.current) return;
        setState({
          items: page.results,
          count: page.count,
          nextPage: page.next ? 2 : null,
          isLoading: false,
          isLoadingMore: false,
          isRefreshing: false,
          error: null,
          moreError: null,
          hasLoaded: true,
          isLocal: false,
        });
      } catch (error) {
        if (id !== requestId.current) return;
        const normalized = normalizeApiError(error);
        const searchText = query.search?.trim();

        // A search typed with no connection is answered from the products saved on the phone, never with a raw error.
        if (
          searchText &&
          shouldSearchLocally({
            isOnline: useNetworkStore.getState().isOnline,
            errorCode: normalized.code,
            status: normalized.status,
          })
        ) {
          const local = (await searchCachedRecords(/^\/api\/v1\/store\/products\/$/u, searchText, [
            'name',
            'brand.name',
          ])) as unknown as StoreProductCard[];

          if (id !== requestId.current) return;
          setState({
            items: local,
            count: local.length,
            nextPage: null,
            isLoading: false,
            isLoadingMore: false,
            isRefreshing: false,
            error: null,
            moreError: null,
            hasLoaded: true,
            isLocal: true,
          });
          return;
        }
        setState((previous) => ({
          ...previous,
          isLoading: false,
          isRefreshing: false,
          // A failed refresh keeps the list the student already has.
          error: mode === 'refresh' && previous.hasLoaded ? null : error,
          items: mode === 'refresh' ? previous.items : [],
        }));
      }
    },
    [accessToken, query],
  );

  useEffect(() => {
    void fetchFirst('initial');
  }, [fetchFirst]);

  const loadMore = useCallback(async () => {
    const { nextPage, isLoadingMore, isLoading, isRefreshing } = state;
    if (!accessToken || nextPage === null || isLoadingMore || isLoading || isRefreshing) return;
    const id = requestId.current;
    setState((previous) => ({ ...previous, isLoadingMore: true, moreError: null }));
    try {
      const page = await storeService.listProducts({ ...query, page: nextPage }, accessToken);
      if (id !== requestId.current) return;
      setState((previous) => {
        const known = new Set(previous.items.map((item) => item.id));

        return {
          ...previous,
          items: [...previous.items, ...page.results.filter((item) => !known.has(item.id))],
          count: page.count,
          nextPage: page.next ? nextPage + 1 : null,
          isLoadingMore: false,
        };
      });
    } catch (error) {
      if (id !== requestId.current) return;
      setState((previous) => ({ ...previous, isLoadingMore: false, moreError: error }));
    }
  }, [accessToken, query, state]);

  const refresh = useCallback(() => fetchFirst('refresh'), [fetchFirst]);
  const retry = useCallback(() => fetchFirst('initial'), [fetchFirst]);

  return { ...state, loadMore, refresh, retry };
}
