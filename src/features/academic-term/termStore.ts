import { create } from 'zustand';

import { useAuthStore } from '../auth/store';
import {
  buildConfirmationRequest,
  confirmTerm,
  loadCurrentTerm,
  toSubmitError,
} from './termService';
import type { CurrentTermResponse, TermSubmitError } from './types';

type TermState = {
  currentTerm: CurrentTermResponse | null;
  isLoading: boolean;
  /** The student answered the question in this session. */
  answered: boolean;
  /** The student chose "not now" after a failed attempt; the question returns on the next launch. */
  postponed: boolean;
  isSubmitting: boolean;
  submitError: TermSubmitError;

  loadCurrentTerm: () => Promise<CurrentTermResponse | null>;
  submit: (input: {
    promoted: boolean;
    academicYearId: string | number | null;
    semesterId: string | number | null;
  }) => Promise<boolean>;
  postpone: () => void;
  clearError: () => void;
  reset: () => void;
};

const initial = {
  currentTerm: null,
  isLoading: false,
  answered: false,
  postponed: false,
  isSubmitting: false,
  submitError: null,
};

let inFlight: Promise<CurrentTermResponse | null> | null = null;

export const useTermStore = create<TermState>((set, get) => ({
  ...initial,

  // Failures are silent on purpose: without the term the screens simply fall back to showing every semester.
  loadCurrentTerm() {
    const { accessToken } = useAuthStore.getState();

    if (!accessToken) {
      return Promise.resolve(get().currentTerm);
    }

    if (inFlight) {
      return inFlight;
    }

    set({ isLoading: true });
    inFlight = loadCurrentTerm(accessToken)
      .then((term) => {
        set({ currentTerm: term, isLoading: false });
        return term;
      })
      .catch(() => {
        set({ isLoading: false });
        return get().currentTerm;
      })
      .finally(() => {
        inFlight = null;
      });

    return inFlight;
  },

  async submit(input) {
    if (get().isSubmitting) {
      return false;
    }

    const request = buildConfirmationRequest(
      input.promoted,
      input.academicYearId,
      input.semesterId,
    );
    const { accessToken } = useAuthStore.getState();

    if (!request || !accessToken) {
      set({ submitError: 'generic' });
      return false;
    }

    set({ isSubmitting: true, submitError: null });

    try {
      await confirmTerm(request, accessToken);
      set({ isSubmitting: false, answered: true, postponed: false, submitError: null });
      return true;
    } catch (error) {
      set({ isSubmitting: false, submitError: toSubmitError(error) });
      return false;
    }
  },

  postpone() {
    set({ postponed: true });
  },

  clearError() {
    set({ submitError: null });
  },

  reset() {
    inFlight = null;
    set(initial);
  },
}));
