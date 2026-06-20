import { create } from 'zustand';

import { useAuthStore } from '../../auth/store';
import {
  loadCurrentProfile,
  toAuthUser,
  toSafeProfileErrorMessage,
  updateCurrentProfile,
} from '../services';
import type { ProfileEditDraft, ProfileUser } from '../types';

type ProfileState = {
  user: ProfileUser | null;
  editDraft: ProfileEditDraft;
  isLoading: boolean;
  isSubmitting: boolean;
  errorMessage: string | null;
  successMessage: string | null;
  lastLoadedAt: string | null;

  loadProfile: () => Promise<void>;
  updateProfile: () => Promise<ProfileUser | null>;
  setFullName: (value: string) => void;
  setUsername: (value: string) => void;
  syncDraftFromUser: () => void;
  resetDraft: () => void;
  clearError: () => void;
  clearMessages: () => void;
  reset: () => void;
};

const EMPTY_DRAFT: ProfileEditDraft = {
  full_name: '',
  username: '',
};

function getInitialProfileState() {
  return {
    user: null,
    editDraft: { ...EMPTY_DRAFT },
    isLoading: false,
    isSubmitting: false,
    errorMessage: null,
    successMessage: null,
    lastLoadedAt: null,
  };
}

const MISSING_SESSION_MESSAGE = 'انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى.';
const FULL_NAME_REQUIRED_MESSAGE = 'يرجى إدخال الاسم الكامل.';
const UPDATE_SUCCESS_MESSAGE = 'تم تحديث الملف الشخصي بنجاح.';

function getAccessToken(): string | null {
  return useAuthStore.getState().accessToken;
}

function buildDraft(user: ProfileUser | null): ProfileEditDraft {
  return {
    full_name: user?.full_name ?? '',
    username: user?.username ?? '',
  };
}

export const useProfileStore = create<ProfileState>((set, get) => {
  function requireToken(): string | null {
    const accessToken = getAccessToken();

    if (!accessToken) {
      set({
        isLoading: false,
        isSubmitting: false,
        errorMessage: MISSING_SESSION_MESSAGE,
      });
      return null;
    }

    return accessToken;
  }

  return {
    ...getInitialProfileState(),

    async loadProfile() {
      if (get().isLoading) {
        return;
      }

      const accessToken = requireToken();

      if (!accessToken) {
        return;
      }

      set({ isLoading: true, errorMessage: null, successMessage: null });

      try {
        const user = await loadCurrentProfile(accessToken);

        set({
          user,
          editDraft: buildDraft(user),
          isLoading: false,
          lastLoadedAt: new Date().toISOString(),
        });
      } catch (error) {
        set({
          isLoading: false,
          errorMessage: toSafeProfileErrorMessage(error),
        });
      }
    },

    async updateProfile() {
      if (get().isSubmitting) {
        return null;
      }

      const draft = get().editDraft;

      if (!draft.full_name.trim()) {
        set({ errorMessage: FULL_NAME_REQUIRED_MESSAGE });
        return null;
      }

      const accessToken = requireToken();

      if (!accessToken) {
        return null;
      }

      set({ isSubmitting: true, errorMessage: null, successMessage: null });

      try {
        const user = await updateCurrentProfile(
          {
            full_name: draft.full_name.trim(),
            username: draft.username.trim(),
          },
          accessToken,
        );

        useAuthStore.getState().setUser(toAuthUser(user));

        set({
          user,
          editDraft: buildDraft(user),
          isSubmitting: false,
          successMessage: UPDATE_SUCCESS_MESSAGE,
          lastLoadedAt: new Date().toISOString(),
        });

        return user;
      } catch (error) {
        set({
          isSubmitting: false,
          errorMessage: toSafeProfileErrorMessage(error),
        });
        return null;
      }
    },

    setFullName(value) {
      set((state) => ({
        editDraft: { ...state.editDraft, full_name: value },
        errorMessage: null,
      }));
    },

    setUsername(value) {
      set((state) => ({
        editDraft: { ...state.editDraft, username: value },
        errorMessage: null,
      }));
    },

    syncDraftFromUser() {
      set((state) => ({ editDraft: buildDraft(state.user) }));
    },

    resetDraft() {
      set((state) => ({ editDraft: buildDraft(state.user), errorMessage: null }));
    },

    clearError() {
      set({ errorMessage: null });
    },

    clearMessages() {
      set({ errorMessage: null, successMessage: null });
    },

    reset() {
      set(getInitialProfileState());
    },
  };
});
