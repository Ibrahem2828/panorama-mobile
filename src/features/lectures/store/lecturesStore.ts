import { create } from 'zustand';

import { useAuthStore } from '../../auth/store';
import { lectureErrorKind, type LectureErrorKind } from '../logic';
import { fetchAllLectures } from '../services/lecturesService';
import type { Lecture } from '../types';

/** The list is shared by the lectures screen, the subject section and search: reuse it for a minute. */
const STALE_AFTER_MS = 60_000;

type LecturesState = {
  lectures: Lecture[];
  isLoading: boolean;
  isRefreshing: boolean;
  errorKind: LectureErrorKind | null;
  lastLoadedAt: number | null;
  /** Account the cached list belongs to (a different student must never see it). */
  ownerId: string | null;

  load: (options?: { force?: boolean }) => Promise<void>;
  refresh: () => Promise<void>;
  reset: () => void;
};

const initialState = {
  lectures: [] as Lecture[],
  isLoading: false,
  isRefreshing: false,
  errorKind: null as LectureErrorKind | null,
  lastLoadedAt: null as number | null,
  ownerId: null as string | null,
};

let latestRequest = 0;

function currentOwner(): string | null {
  const user = useAuthStore.getState().user;
  return user?.id === undefined || user?.id === null ? null : String(user.id);
}

export const useLecturesStore = create<LecturesState>((set, get) => {
  async function run(mode: 'load' | 'refresh', force: boolean) {
    const state = get();
    const owner = currentOwner();
    if (state.isLoading || state.isRefreshing) return;
    const sameOwner = state.ownerId === owner;
    const fresh =
      sameOwner && state.lastLoadedAt !== null && Date.now() - state.lastLoadedAt < STALE_AFTER_MS;
    if (mode === 'load' && !force && fresh && !state.errorKind) return;

    latestRequest += 1;
    const requestId = latestRequest;
    // Never show another account's lectures while this one loads.
    if (!sameOwner) set({ ...initialState, ownerId: owner });
    const hasData = get().lastLoadedAt !== null;
    set({
      isLoading: mode === 'load' && !hasData,
      isRefreshing: mode === 'refresh' || (mode === 'load' && hasData),
      errorKind: null,
    });

    try {
      const lectures = await fetchAllLectures();
      if (requestId !== latestRequest) return;
      set({ lectures, isLoading: false, isRefreshing: false, lastLoadedAt: Date.now() });
    } catch (error) {
      if (requestId !== latestRequest) return;
      set({ isLoading: false, isRefreshing: false, errorKind: lectureErrorKind(error) });
    }
  }

  return {
    ...initialState,
    load: (options) => run('load', options?.force === true),
    refresh: () => run('refresh', true),
    reset: () => {
      latestRequest += 1;
      set(initialState);
    },
  };
});
