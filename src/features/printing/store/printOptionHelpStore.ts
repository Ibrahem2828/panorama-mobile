import { create } from 'zustand';

import { printingService as apiPrinting } from '../../../api';
import { useAuthStore } from '../../auth/store';
import {
  EMPTY_HELP_INDEX,
  asyncPrintHelpStorage,
  buildHelpIndex,
  isHelpFresh,
  syncPrintHelp,
  type PrintHelpCache,
  type PrintHelpIndex,
} from '../services/printOptionHelp';

type PrintOptionHelpState = {
  index: PrintHelpIndex;
  cache: PrintHelpCache | null;
  lastFetchedAt: number | null;
  inFlight: boolean;
  /** Shows the saved copy at once, then asks the server unless a recent answer is already held. Never throws. */
  ensureLoaded: () => Promise<void>;
  reset: () => void;
};

function apply(cache: PrintHelpCache | null) {
  return { cache, index: cache ? buildHelpIndex(cache.items) : EMPTY_HELP_INDEX };
}

export const usePrintOptionHelpStore = create<PrintOptionHelpState>()((set, get) => ({
  index: EMPTY_HELP_INDEX,
  cache: null,
  lastFetchedAt: null,
  inFlight: false,
  async ensureLoaded() {
    const state = get();

    if (state.inFlight || isHelpFresh(state.lastFetchedAt, Date.now())) {
      return;
    }

    set({ inFlight: true });

    try {
      if (!state.cache) {
        // The copy from the last session is shown right away, before (and even without) a network answer.
        const stored = await asyncPrintHelpStorage.read();

        if (stored && !get().cache) {
          set(apply(stored));
        }
      }

      const authToken = useAuthStore.getState().accessToken;

      if (!authToken) {
        return;
      }

      const result = await syncPrintHelp(
        {
          fetchHelp: () => apiPrinting.getPrintOptionHelp(authToken),
          storage: asyncPrintHelpStorage,
        },
        get().cache,
      );

      set({
        ...apply(result.cache),
        // A failed attempt is retried the next time a print flow opens.
        lastFetchedAt: result.fetched ? Date.now() : null,
      });
    } catch {
      // Help is optional: whatever went wrong, ordering continues without it.
    } finally {
      set({ inFlight: false });
    }
  },
  reset: () => set({ ...apply(null), lastFetchedAt: null, inFlight: false }),
}));
