import { create } from 'zustand';

import {
  normalizeApiError,
  phoneVerificationService,
  type PhoneVerificationRequest,
} from '../../../api';
import { logger } from '../../../utils/logger';
import { useAuthStore } from '../../auth/store';
import { useGroupsStore } from '../../groups/store';
import { useProfileStore } from '../../profile/store';
import {
  classifyPhoneFailure,
  isOpenStatus,
  shouldRefreshAfterFailure,
  type PhoneFailure,
} from '../services/phoneVerificationLogic';

type PhoneVerificationState = {
  request: PhoneVerificationRequest | null;
  hasLoaded: boolean;
  isLoading: boolean;
  isSubmitting: boolean;
  failure: PhoneFailure | null;

  load: (options?: { silent?: boolean }) => Promise<void>;
  submit: (phoneE164: string, password: string) => Promise<boolean>;
  confirm: (code: string) => Promise<boolean>;
  cancel: () => Promise<void>;
  clearFailure: () => void;
  reset: () => void;
};

const initialState = {
  request: null,
  hasLoaded: false,
  isLoading: false,
  isSubmitting: false,
  failure: null,
};

/** Bumped by every write, so a status read that started earlier can never overwrite a newer result. */
let writeVersion = 0;

function toFailure(error: unknown): PhoneFailure {
  const normalized = normalizeApiError(error);

  return classifyPhoneFailure({
    code: normalized.code,
    errorCode: normalized.errorCode,
    status: normalized.status,
    details: normalized.details,
    retryAfterSeconds: normalized.retryAfterSeconds,
  });
}

/**
 * The phone is verified: the account chip turns green, and the server has just put the student in the community
 * group, so the groups list is re-read (nothing to join by hand).
 */
function onVerified(request: PhoneVerificationRequest | null): void {
  const auth = useAuthStore.getState();

  if (auth.user) {
    auth.setUser({
      ...auth.user,
      is_phone_verified: true,
      phone_number: request?.phone_number ?? auth.user.phone_number,
    });
  }

  void useProfileStore
    .getState()
    .loadProfile()
    .catch(() => undefined);
  void useGroupsStore
    .getState()
    .refreshAllGroups()
    .catch(() => undefined);
}

export const usePhoneVerificationStore = create<PhoneVerificationState>((set, get) => ({
  ...initialState,

  async load(options) {
    const token = useAuthStore.getState().accessToken;

    if (!token) return;

    const version = writeVersion;
    const silent = options?.silent === true && get().hasLoaded;

    if (!silent) set({ isLoading: true });

    try {
      const { request } = await phoneVerificationService.getCurrentPhoneVerification(token);

      if (version !== writeVersion) return;

      const becameVerified =
        request?.status === 'verified' && get().request?.status !== 'verified' && get().hasLoaded;

      set({ request, hasLoaded: true, isLoading: false });

      if (becameVerified) onVerified(request);
    } catch (error) {
      logger.warn('Phone verification status failed', { code: normalizeApiError(error).code });

      // A silent refresh must not replace a working screen with an error; the next tick tries again.
      set({ isLoading: false, ...(silent ? {} : { failure: toFailure(error) }) });
    }
  },

  async submit(phoneE164, password) {
    const token = useAuthStore.getState().accessToken;

    if (!token || get().isSubmitting) return false;

    writeVersion += 1;
    set({ isSubmitting: true, failure: null });

    try {
      const request = await phoneVerificationService.createPhoneVerification(
        { phone_number: phoneE164, password },
        token,
      );

      writeVersion += 1;
      set({ request, hasLoaded: true, isSubmitting: false });

      return true;
    } catch (error) {
      const failure = toFailure(error);

      set({ isSubmitting: false, failure });

      if (shouldRefreshAfterFailure(failure)) void get().load({ silent: true });
      if (failure.kind === 'already_verified') void useProfileStore.getState().loadProfile();

      return false;
    }
  },

  async confirm(code) {
    const token = useAuthStore.getState().accessToken;

    if (!token || get().isSubmitting) return false;

    writeVersion += 1;
    set({ isSubmitting: true, failure: null });

    try {
      const request = await phoneVerificationService.confirmPhoneVerification(code, token);

      writeVersion += 1;
      set({ request, hasLoaded: true, isSubmitting: false });

      if (request.status === 'verified') {
        onVerified(request);
        return true;
      }

      return false;
    } catch (error) {
      const failure = toFailure(error);

      writeVersion += 1;
      // A wrong code lowers the attempts left shown on screen straight away; the next read confirms it.
      const current = get().request;
      set({
        isSubmitting: false,
        failure,
        request:
          failure.kind === 'code_invalid' &&
          failure.attemptsRemaining !== null &&
          current &&
          isOpenStatus(current.status)
            ? { ...current, attempts_remaining: failure.attemptsRemaining }
            : current,
      });

      if (shouldRefreshAfterFailure(failure)) void get().load({ silent: true });

      return false;
    }
  },

  async cancel() {
    const token = useAuthStore.getState().accessToken;

    if (!token || get().isSubmitting) return;

    writeVersion += 1;
    set({ isSubmitting: true, failure: null });

    try {
      const request = await phoneVerificationService.cancelPhoneVerification(token);

      writeVersion += 1;
      set({ request, hasLoaded: true, isSubmitting: false });
    } catch (error) {
      const failure = toFailure(error);

      set({ isSubmitting: false, failure });

      // 404: it was already closed (code expired, or staff rejected it): show what the server holds now.
      if (failure.kind === 'not_found' || shouldRefreshAfterFailure(failure)) {
        void get().load({ silent: true });
      }
    }
  },

  clearFailure() {
    set({ failure: null });
  },

  reset() {
    writeVersion += 1;
    set({ ...initialState });
  },
}));

// A request belongs to one account: drop it when the session ends so the next student starts clean.
useAuthStore.subscribe((state, previous) => {
  if (previous.status === 'authenticated' && state.status !== 'authenticated') {
    usePhoneVerificationStore.getState().reset();
  }
});
