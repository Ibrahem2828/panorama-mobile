import { create } from 'zustand';

import { useLocaleStore } from '../../../i18n';
import { useAuthStore } from '../../auth/store';
import {
  isAnnouncementNotFound,
  loadAnnouncementDetail,
  loadAnnouncementsPage,
  mergeAnnouncementPages,
  readStoredReadIds,
  rememberReadId,
  toSafeAnnouncementsErrorMessage,
  writeStoredReadIds,
} from '../services';
import type { AnnouncementItem } from '../types';

type DetailStatus = 'loading' | 'ready' | 'missing' | 'error';

type AnnouncementsState = {
  items: AnnouncementItem[];
  total: number;
  nextPage: number | null;
  readIds: string[];
  hasHydratedReadIds: boolean;
  isLoading: boolean;
  isRefreshing: boolean;
  isLoadingMore: boolean;
  errorMessage: string | null;
  loadMoreErrorMessage: string | null;
  hasLoaded: boolean;
  details: Record<string, AnnouncementItem>;
  detailStatus: Record<string, DetailStatus>;
  detailError: Record<string, string>;

  hydrateReadIds: () => Promise<void>;
  loadFirstPage: () => Promise<void>;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  loadDetail: (id: string | number) => Promise<void>;
  markRead: (id: string | number) => void;
  reset: () => void;
};

function catalog() {
  return useLocaleStore.getState().t.announcements;
}

function getInitialState() {
  return {
    items: [] as AnnouncementItem[],
    total: 0,
    nextPage: null as number | null,
    hasLoaded: false,
    isLoading: false,
    isRefreshing: false,
    isLoadingMore: false,
    errorMessage: null as string | null,
    loadMoreErrorMessage: null as string | null,
    details: {} as Record<string, AnnouncementItem>,
    detailStatus: {} as Record<string, DetailStatus>,
    detailError: {} as Record<string, string>,
  };
}

export const useAnnouncementsStore = create<AnnouncementsState>((set, get) => {
  async function fetchFirstPage(mode: 'load' | 'refresh') {
    const token = useAuthStore.getState().accessToken;

    if (!token) {
      set({ errorMessage: catalog().errors.unauthorized });
      return;
    }

    set(
      mode === 'load'
        ? { isLoading: true, errorMessage: null }
        : { isRefreshing: true, errorMessage: null },
    );

    try {
      const response = await loadAnnouncementsPage(1, token);

      set({
        items: response.results,
        total: response.count,
        nextPage: response.next ? 2 : null,
        hasLoaded: true,
        isLoading: false,
        isRefreshing: false,
        loadMoreErrorMessage: null,
      });
    } catch (error) {
      set({
        isLoading: false,
        isRefreshing: false,
        errorMessage: toSafeAnnouncementsErrorMessage(error, catalog()),
      });
    }
  }

  return {
    ...getInitialState(),
    readIds: [],
    hasHydratedReadIds: false,

    async hydrateReadIds() {
      if (get().hasHydratedReadIds) {
        return;
      }

      const stored = await readStoredReadIds();

      set((state) => ({
        readIds: Array.from(new Set([...stored, ...state.readIds])),
        hasHydratedReadIds: true,
      }));
    },

    async loadFirstPage() {
      if (get().isLoading || get().isRefreshing) {
        return;
      }

      await fetchFirstPage('load');
    },

    async refresh() {
      if (get().isRefreshing) {
        return;
      }

      await fetchFirstPage('refresh');
    },

    async loadMore() {
      const { nextPage, isLoadingMore, isLoading, isRefreshing } = get();
      const token = useAuthStore.getState().accessToken;

      if (nextPage === null || isLoadingMore || isLoading || isRefreshing || !token) {
        return;
      }

      set({ isLoadingMore: true, loadMoreErrorMessage: null });

      try {
        const response = await loadAnnouncementsPage(nextPage, token);

        set((state) => ({
          items: mergeAnnouncementPages(state.items, response.results),
          total: response.count,
          nextPage: response.next ? nextPage + 1 : null,
          isLoadingMore: false,
        }));
      } catch (error) {
        set({
          isLoadingMore: false,
          loadMoreErrorMessage: toSafeAnnouncementsErrorMessage(error, catalog()),
        });
      }
    },

    async loadDetail(id) {
      const key = String(id);
      const token = useAuthStore.getState().accessToken;

      if (!token || get().detailStatus[key] === 'loading') {
        return;
      }

      set((state) => ({ detailStatus: { ...state.detailStatus, [key]: 'loading' } }));

      try {
        const detail = await loadAnnouncementDetail(id, token);

        set((state) => ({
          details: { ...state.details, [key]: detail },
          detailStatus: { ...state.detailStatus, [key]: 'ready' },
        }));
      } catch (error) {
        set((state) => ({
          detailStatus: {
            ...state.detailStatus,
            [key]: isAnnouncementNotFound(error) ? 'missing' : 'error',
          },
          detailError: {
            ...state.detailError,
            [key]: toSafeAnnouncementsErrorMessage(error, catalog()),
          },
        }));
      }
    },

    markRead(id) {
      const next = rememberReadId(get().readIds, id);

      if (next === get().readIds) {
        return;
      }

      set({ readIds: next });
      void writeStoredReadIds(next);
    },

    reset() {
      set({ ...getInitialState() });
    },
  };
});
