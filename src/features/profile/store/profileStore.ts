import { create } from 'zustand';

import { useLocaleStore } from '../../../i18n';
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

// Read when the action runs, not at module load, so messages follow the current locale.
function profileCatalog() {
  return useLocaleStore.getState().t.profile;
}

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
        errorMessage: profileCatalog().errors.unauthorized,
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
          errorMessage: toSafeProfileErrorMessage(error, profileCatalog()),
        });
      }
    },

    async updateProfile() {
      if (get().isSubmitting) {
        return null;
      }

      const draft = get().editDraft;

      if (!draft.full_name.trim()) {
        set({ errorMessage: profileCatalog().edit.fullNameRequired });
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
          successMessage: profileCatalog().edit.updateSuccess,
          lastLoadedAt: new Date().toISOString(),
        });

        return user;
      } catch (error) {
        set({
          isSubmitting: false,
          errorMessage: toSafeProfileErrorMessage(error, profileCatalog()),
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
