import { create } from 'zustand';

/**
 * Connectivity as the rest of the app needs it. `isOnline` is false only when the device says so definitively (NetInfo
 * reports no connection or no internet): unknown counts as online, so a slow NetInfo start never blocks a request.
 */
type NetworkState = {
  isOnline: boolean;
  /** Counts offline -> online transitions; screens refresh their data when it changes. */
  reconnects: number;
  /** When the most recent response came from the offline cache instead of the server (0 = never). */
  lastCacheServeAt: number;
  /** When that cached copy was saved on the device, i.e. how old the shown data is. */
  lastCachedSavedAt: number | null;
  setOnline: (isOnline: boolean) => void;
  markServedFromCache: (savedAt: number, now?: number) => void;
  markFresh: () => void;
};

export const useNetworkStore = create<NetworkState>((set) => ({
  isOnline: true,
  reconnects: 0,
  lastCacheServeAt: 0,
  lastCachedSavedAt: null,

  setOnline(isOnline) {
    set((state) =>
      state.isOnline === isOnline
        ? state
        : { isOnline, reconnects: isOnline ? state.reconnects + 1 : state.reconnects },
    );
  },

  markServedFromCache(savedAt, now = Date.now()) {
    set({ lastCacheServeAt: now, lastCachedSavedAt: savedAt });
  },

  markFresh() {
    set((state) => (state.lastCachedSavedAt === null ? state : { lastCachedSavedAt: null }));
  },
}));

export function isDeviceOffline(): boolean {
  return !useNetworkStore.getState().isOnline;
}

/** NetInfo state -> online flag (unknown = online). */
export function isOnlineFromNetInfo(state: {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
}): boolean {
  return state.isConnected !== false && state.isInternetReachable !== false;
}
