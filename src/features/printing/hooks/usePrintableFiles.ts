import { useCallback, useEffect, useRef, useState } from 'react';

import { useLocaleStore } from '../../../i18n';
import { useAuthStore } from '../../auth/store';
import { loadFilesPage, toSafeFilesErrorMessage } from '../../files/services';
import type { FileResource } from '../../files/types';

const SEARCH_DEBOUNCE_MS = 350;

type State = {
  files: FileResource[];
  nextPage: number | null;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
};

const INITIAL_STATE: State = {
  files: [],
  nextPage: null,
  isLoading: false,
  isLoadingMore: false,
  error: null,
};

/**
 * Server-searched, paginated list of the files a student may print. Only active while
 * `enabled` is true so the picker costs nothing until it is opened. Responses for an older
 * search are discarded.
 */
export function usePrintableFiles(search: string, enabled: boolean) {
  const [state, setState] = useState<State>(INITIAL_STATE);
  const requestId = useRef(0);
  const [debounced, setDebounced] = useState(search);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search), SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [search]);

  const fetchPage = useCallback(async (page: number, query: string, append: boolean) => {
    const token = useAuthStore.getState().accessToken;
    const id = ++requestId.current;

    if (!token) {
      return;
    }

    setState((current) => ({
      ...current,
      isLoading: !append,
      isLoadingMore: append,
      error: null,
    }));

    try {
      const response = await loadFilesPage(token, { page, search: query, printableOnly: true });

      if (id !== requestId.current) {
        return;
      }

      setState((current) => {
        const known = new Set(append ? current.files.map((file) => String(file.id)) : []);
        const fresh = response.results.filter(
          (file) => file.is_printable !== false && !known.has(String(file.id)),
        );

        return {
          files: append ? [...current.files, ...fresh] : fresh,
          nextPage: response.next ? page + 1 : null,
          isLoading: false,
          isLoadingMore: false,
          error: null,
        };
      });
    } catch (error) {
      if (id !== requestId.current) {
        return;
      }

      setState((current) => ({
        ...current,
        isLoading: false,
        isLoadingMore: false,
        error: toSafeFilesErrorMessage(error, useLocaleStore.getState().t.files),
      }));
    }
  }, []);

  useEffect(() => {
    if (enabled) {
      void fetchPage(1, debounced, false);
    }
  }, [debounced, enabled, fetchPage]);

  const loadMore = useCallback(() => {
    if (state.nextPage !== null && !state.isLoading && !state.isLoadingMore) {
      void fetchPage(state.nextPage, debounced, true);
    }
  }, [debounced, fetchPage, state.isLoading, state.isLoadingMore, state.nextPage]);

  const reload = useCallback(() => void fetchPage(1, debounced, false), [debounced, fetchPage]);

  return { ...state, loadMore, reload };
}
