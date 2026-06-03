import { create } from 'zustand';

import { useAuthStore } from '../../auth/store';
import { getHomeData, toSafeHomeErrorMessage } from '../services';
import type { Announcement } from '../types';

type HomeState = {
  announcements: Announcement[];
  unreadNotificationsCount: number;
  isLoading: boolean;
  isRefreshing: boolean;
  errorMessage: string | null;
  lastLoadedAt: string | null;
  lastAuthUserId: string | number | null;

  loadHome: () => Promise<void>;
  refreshHome: () => Promise<void>;
  setUnreadNotificationsCount: (count: number) => void;
  clearError: () => void;
};

const MISSING_SESSION_MESSAGE = 'انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى.';

async function loadHomeData(set: HomeSetState, mode: 'load' | 'refresh') {
  const { accessToken, user } = useAuthStore.getState();

  if (!accessToken) {
    set({
      announcements: [],
      unreadNotificationsCount: 0,
      isLoading: false,
      isRefreshing: false,
      errorMessage: MISSING_SESSION_MESSAGE,
      lastLoadedAt: null,
      lastAuthUserId: null,
    });
    return;
  }

  set({
    isLoading: mode === 'load',
    isRefreshing: mode === 'refresh',
    errorMessage: null,
  });

  try {
    const homeData = await getHomeData(accessToken);

    set({
      announcements: homeData.announcements,
      unreadNotificationsCount: homeData.unreadNotificationsCount,
      isLoading: false,
      isRefreshing: false,
      errorMessage: null,
      lastLoadedAt: new Date().toISOString(),
      lastAuthUserId: user?.id ?? null,
    });
  } catch (error) {
    set({
      isLoading: false,
      isRefreshing: false,
      errorMessage: toSafeHomeErrorMessage(error),
    });
  }
}

type HomeSetState = (
  partial: Partial<HomeState> | ((state: HomeState) => Partial<HomeState>),
  replace?: false,
) => void;

export const useHomeStore = create<HomeState>((set, get) => ({
  announcements: [],
  unreadNotificationsCount: 0,
  isLoading: false,
  isRefreshing: false,
  errorMessage: null,
  lastLoadedAt: null,
  lastAuthUserId: null,

  async loadHome() {
    const { isLoading, isRefreshing, lastLoadedAt, lastAuthUserId } = get();
    const currentUserId = useAuthStore.getState().user?.id ?? null;

    if (isLoading || isRefreshing || (lastLoadedAt && lastAuthUserId === currentUserId)) {
      return;
    }

    await loadHomeData(set, 'load');
  },

  async refreshHome() {
    const { isLoading, isRefreshing } = get();

    if (isLoading || isRefreshing) {
      return;
    }

    await loadHomeData(set, 'refresh');
  },

  setUnreadNotificationsCount(count) {
    set({ unreadNotificationsCount: Math.max(0, count) });
  },

  clearError() {
    set({ errorMessage: null });
  },
}));
