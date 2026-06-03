import { create } from 'zustand';

import { useAuthStore } from '../../auth/store';
import {
  getMyVerification,
  resubmitStudentVerification,
  submitStudentVerification,
  toSafeVerificationErrorMessage,
} from '../services';
import type { VerificationCardImage, VerificationLoadOptions, VerificationRecord } from '../types';

type VerificationState = {
  verification: VerificationRecord | null;
  selectedCardImage: VerificationCardImage | null;
  hasLoadedVerification: boolean;
  lastAuthUserId: string | number | null;
  isLoadingVerification: boolean;
  isSubmitting: boolean;
  errorMessage: string | null;

  loadVerification: (options?: VerificationLoadOptions) => Promise<void>;
  setSelectedCardImage: (image: VerificationCardImage | null) => void;
  submitVerification: () => Promise<VerificationRecord | null>;
  resubmitVerification: () => Promise<VerificationRecord | null>;
  clearSelectedCardImage: () => void;
  clearError: () => void;
  reset: () => void;
};

type AuthContext = {
  accessToken: string;
  userId: string | number | null;
};

const MISSING_SESSION_MESSAGE = 'انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى.';
const MISSING_IMAGE_MESSAGE = 'يرجى اختيار صورة واضحة لبطاقة الطالب قبل الإرسال.';

function getInitialVerificationState() {
  return {
    verification: null,
    selectedCardImage: null,
    hasLoadedVerification: false,
    lastAuthUserId: null,
    isLoadingVerification: false,
    isSubmitting: false,
    errorMessage: null,
  };
}

function requireAuthContext(): AuthContext {
  const { accessToken, user } = useAuthStore.getState();

  if (!accessToken) {
    throw new Error(MISSING_SESSION_MESSAGE);
  }

  return {
    accessToken,
    userId: user?.id ?? null,
  };
}

function requireSelectedCardImage(image: VerificationCardImage | null): VerificationCardImage {
  if (!image) {
    throw new Error(MISSING_IMAGE_MESSAGE);
  }

  return image;
}

export const useVerificationStore = create<VerificationState>((set, get) => ({
  ...getInitialVerificationState(),

  async loadVerification(options) {
    const { isLoadingVerification, hasLoadedVerification, lastAuthUserId } = get();
    const { accessToken, userId } = requireAuthContext();

    if (isLoadingVerification) {
      return;
    }

    if (!options?.force && hasLoadedVerification && lastAuthUserId === userId) {
      return;
    }

    set({
      isLoadingVerification: true,
      errorMessage: null,
      lastAuthUserId: userId,
    });

    try {
      const verification = await getMyVerification(accessToken);

      set({
        verification,
        hasLoadedVerification: true,
        isLoadingVerification: false,
      });
    } catch (error) {
      set({
        hasLoadedVerification: true,
        isLoadingVerification: false,
        errorMessage: toSafeVerificationErrorMessage(error),
      });
    }
  },

  setSelectedCardImage(image) {
    set({
      selectedCardImage: image,
      errorMessage: null,
    });
  },

  async submitVerification() {
    try {
      const image = requireSelectedCardImage(get().selectedCardImage);
      const { accessToken } = requireAuthContext();

      set({
        isSubmitting: true,
        errorMessage: null,
      });

      const verification = await submitStudentVerification(image, accessToken);

      set({
        verification,
        selectedCardImage: null,
        hasLoadedVerification: true,
        isSubmitting: false,
      });

      return verification;
    } catch (error) {
      set({
        isSubmitting: false,
        errorMessage:
          error instanceof Error && error.message === MISSING_IMAGE_MESSAGE
            ? MISSING_IMAGE_MESSAGE
            : toSafeVerificationErrorMessage(error),
      });

      throw error;
    }
  },

  async resubmitVerification() {
    try {
      const image = requireSelectedCardImage(get().selectedCardImage);
      const { accessToken } = requireAuthContext();

      set({
        isSubmitting: true,
        errorMessage: null,
      });

      const verification = await resubmitStudentVerification(image, accessToken);

      set({
        verification,
        selectedCardImage: null,
        hasLoadedVerification: true,
        isSubmitting: false,
      });

      return verification;
    } catch (error) {
      set({
        isSubmitting: false,
        errorMessage:
          error instanceof Error && error.message === MISSING_IMAGE_MESSAGE
            ? MISSING_IMAGE_MESSAGE
            : toSafeVerificationErrorMessage(error),
      });

      throw error;
    }
  },

  clearSelectedCardImage() {
    set({ selectedCardImage: null });
  },

  clearError() {
    set({ errorMessage: null });
  },

  reset() {
    set(getInitialVerificationState());
  },
}));
