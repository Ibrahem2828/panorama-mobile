import { create } from 'zustand';

import { useLocaleStore } from '../../../i18n';

import { useAuthStore } from '../../auth/store';
import { useFeedbackStore } from '../../feedback/store';
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

// Read when the action runs so the message follows the current locale.
function verificationCatalog() {
  return useLocaleStore.getState().t.verificationFlow;
}

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
    throw new Error(verificationCatalog().errors.unauthorized);
  }

  return {
    accessToken,
    userId: user?.id ?? null,
  };
}

function requireSelectedCardImage(image: VerificationCardImage | null): VerificationCardImage {
  if (!image) {
    throw new Error(verificationCatalog().errors.missingImage);
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
        errorMessage: toSafeVerificationErrorMessage(error, verificationCatalog()),
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
      if (verification) {
        void useFeedbackStore.getState().requestPrompt({
          context: 'verification',
          actionKey: 'verification.submitted',
          objectType: 'verification',
          objectId: verification.id,
        });
      }

      return verification;
    } catch (error) {
      set({
        isSubmitting: false,
        errorMessage:
          error instanceof Error && error.message === verificationCatalog().errors.missingImage
            ? verificationCatalog().errors.missingImage
            : toSafeVerificationErrorMessage(error, verificationCatalog()),
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
      if (verification) {
        void useFeedbackStore.getState().requestPrompt({
          context: 'verification',
          actionKey: 'verification.submitted',
          objectType: 'verification',
          objectId: verification.id,
        });
      }

      return verification;
    } catch (error) {
      set({
        isSubmitting: false,
        errorMessage:
          error instanceof Error && error.message === verificationCatalog().errors.missingImage
            ? verificationCatalog().errors.missingImage
            : toSafeVerificationErrorMessage(error, verificationCatalog()),
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
