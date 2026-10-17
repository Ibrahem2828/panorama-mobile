import { create } from 'zustand';

import { normalizeApiError, policiesService, runIdempotentAction } from '../../../api';
import { useLocaleStore } from '../../../i18n';
import { useAuthStore } from '../../auth/store';
import {
  acceptanceBody,
  acceptanceSignature,
  normalizePolicyStatus,
  pendingFromStatus,
  type PendingPolicy,
  type PolicyStatus,
} from '../services/policyModel';

type PoliciesState = {
  status: PolicyStatus | null;
  isAccepting: boolean;
  errorMessage: string | null;

  loadStatus: () => Promise<void>;
  accept: () => Promise<boolean>;
  reset: () => void;
};

function catalog() {
  return useLocaleStore.getState().t.policies;
}

export const usePoliciesStore = create<PoliciesState>((set, get) => ({
  status: null,
  isAccepting: false,
  errorMessage: null,

  /** A failed lookup never locks the student out: the gate stays closed and the next load asks again. */
  async loadStatus() {
    const token = useAuthStore.getState().accessToken;

    if (!token) {
      return;
    }

    try {
      set({ status: normalizePolicyStatus(await policiesService.getPolicyStatus(token)) });
    } catch {
      // Fail open on purpose.
    }
  },

  async accept() {
    const token = useAuthStore.getState().accessToken;
    const pending: PendingPolicy[] = pendingFromStatus(get().status);

    if (!token || pending.length === 0 || get().isAccepting) {
      return false;
    }

    const locale = useLocaleStore.getState().locale === 'en' ? 'en' : 'ar';

    set({ isAccepting: true, errorMessage: null });

    try {
      await runIdempotentAction('policies:accept', acceptanceSignature(pending), (key) =>
        policiesService.acceptPolicies(acceptanceBody(pending, locale), token, key),
      );
      // Server truth: the gate lifts only once the refreshed status no longer asks for acceptance.
      set({ isAccepting: false });
      await get().loadStatus();

      return pendingFromStatus(get().status).length === 0;
    } catch (error) {
      const normalized = normalizeApiError(error);

      set({
        isAccepting: false,
        errorMessage:
          normalized.code === 'NETWORK_ERROR' || normalized.code === 'TIMEOUT'
            ? catalog().errors.network
            : catalog().errors.generic,
      });

      return false;
    }
  },

  reset() {
    set({ status: null, isAccepting: false, errorMessage: null });
  },
}));
