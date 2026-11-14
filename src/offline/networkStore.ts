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
  /** NetInfo's own reachability verdict (null = unknown). Only a hint: it can be wrong on networks that block its probe. */
  internetReachable: boolean | null;
  /** Consecutive requests that never reached the server (network error or timeout); any response resets it. */
  linkFailures: number;
  /** A request got through since NetInfo last reported the internet unreachable. */
  okSinceUnreachable: boolean;
  setOnline: (isOnline: boolean) => void;
  setReachable: (reachable: boolean | null) => void;
  noteRequestReachedServer: () => void;
  noteRequestLostLink: () => void;
  markServedFromCache: (savedAt: number, now?: number) => void;
  markFresh: () => void;
};

export const useNetworkStore = create<NetworkState>((set) => ({
  isOnline: true,
  reconnects: 0,
  lastCacheServeAt: 0,
  lastCachedSavedAt: null,
  internetReachable: null,
  linkFailures: 0,
  okSinceUnreachable: true,

  setReachable(reachable) {
    set((state) =>
      state.internetReachable === reachable
        ? state
        : { internetReachable: reachable, okSinceUnreachable: reachable === false ? false : true },
    );
  },

  noteRequestReachedServer() {
    set((state) =>
      state.linkFailures === 0 && state.okSinceUnreachable
        ? state
        : { linkFailures: 0, okSinceUnreachable: true },
    );
  },

  noteRequestLostLink() {
    set((state) => ({ linkFailures: state.linkFailures + 1 }));
  },

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

/**
 * NetInfo state -> online flag. Only "no network interface at all" counts as offline: NetInfo's own reachability probe can
 * fail on networks that block or throttle its test address even though our server is reachable, and a wrong "offline"
 * would block sign-in and every send. Real server outages are handled by the request itself (cache fallback on error).
 */
export function isOnlineFromNetInfo(state: {
  isConnected: boolean | null;
  isInternetReachable?: boolean | null;
}): boolean {
  return state.isConnected !== false;
}

export type ConnectionQuality = 'offline' | 'weak' | 'good';

/** Two lost requests in a row mean the link is unusable for now, even if the device says it is connected. */
export const WEAK_AFTER_FAILURES = 2;

/**
 * What the connectivity banner shows. Offline wins; "weak" is online but the requests are not getting through (consecutive
 * lost requests), or NetInfo says the internet is unreachable and nothing has got through since. It clears itself the
 * moment a request reaches the server again.
 */
export function connectionQuality(input: {
  isOnline: boolean;
  internetReachable: boolean | null;
  linkFailures: number;
  okSinceUnreachable: boolean;
}): ConnectionQuality {
  if (!input.isOnline) return 'offline';
  if (input.linkFailures >= WEAK_AFTER_FAILURES) return 'weak';
  if (input.internetReachable === false && !input.okSinceUnreachable) return 'weak';

  return 'good';
}
