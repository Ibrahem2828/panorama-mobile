import { create } from 'zustand';

import { useLocaleStore } from '../../../i18n';

import { useAuthStore } from '../../auth/store';
import {
  changeCurrentPassword,
  hasChangePasswordValidationErrors,
  toSafeSettingsErrorMessage,
  validateChangePasswordInput,
  type ChangePasswordValidation,
} from '../services';
import type { ChangePasswordDraft } from '../types';

type SettingsState = {
  passwordDraft: ChangePasswordDraft;
  passwordValidation: ChangePasswordValidation;
  isChangingPassword: boolean;
  errorMessage: string | null;
  successMessage: string | null;

  setOldPassword: (value: string) => void;
  setNewPassword: (value: string) => void;
  setNewPasswordConfirm: (value: string) => void;
  changePassword: () => Promise<boolean>;
  resetPasswordDraft: () => void;
  clearMessages: () => void;
  reset: () => void;
};

const EMPTY_PASSWORD_DRAFT: ChangePasswordDraft = {
  old_password: '',
  new_password: '',
  new_password_confirm: '',
};

function getInitialSettingsState() {
  return {
    passwordDraft: { ...EMPTY_PASSWORD_DRAFT },
    passwordValidation: {},
    isChangingPassword: false,
    errorMessage: null,
    successMessage: null,
  };
}

// Read when the action runs so the message follows the current locale.
function settingsCatalog() {
  return useLocaleStore.getState().t.settings;
}

function getAccessToken(): string | null {
  return useAuthStore.getState().accessToken;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...getInitialSettingsState(),

  setOldPassword(value) {
    set((state) => ({
      passwordDraft: { ...state.passwordDraft, old_password: value },
      passwordValidation: { ...state.passwordValidation, old_password: undefined },
      errorMessage: null,
      successMessage: null,
    }));
  },

  setNewPassword(value) {
    set((state) => ({
      passwordDraft: { ...state.passwordDraft, new_password: value },
      passwordValidation: { ...state.passwordValidation, new_password: undefined },
      errorMessage: null,
      successMessage: null,
    }));
  },

  setNewPasswordConfirm(value) {
    set((state) => ({
      passwordDraft: { ...state.passwordDraft, new_password_confirm: value },
      passwordValidation: { ...state.passwordValidation, new_password_confirm: undefined },
      errorMessage: null,
      successMessage: null,
    }));
  },

  async changePassword() {
    if (get().isChangingPassword) {
      return false;
    }

    const passwordDraft = get().passwordDraft;
    const validation = validateChangePasswordInput(passwordDraft, settingsCatalog());

    set({ passwordValidation: validation });

    if (hasChangePasswordValidationErrors(validation)) {
      return false;
    }

    const accessToken = getAccessToken();

    if (!accessToken) {
      set({ errorMessage: settingsCatalog().errors.unauthorized });
      return false;
    }

    set({ isChangingPassword: true, errorMessage: null, successMessage: null });

    try {
      await changeCurrentPassword(passwordDraft, accessToken);
      set({
        passwordDraft: EMPTY_PASSWORD_DRAFT,
        passwordValidation: {},
        isChangingPassword: false,
        successMessage: settingsCatalog().changePassword.success,
      });
      return true;
    } catch (error) {
      set({
        isChangingPassword: false,
        errorMessage: toSafeSettingsErrorMessage(error, settingsCatalog()),
      });
      return false;
    }
  },

  resetPasswordDraft() {
    set({
      passwordDraft: EMPTY_PASSWORD_DRAFT,
      passwordValidation: {},
      errorMessage: null,
      successMessage: null,
    });
  },

  clearMessages() {
    set({ errorMessage: null, successMessage: null });
  },

  reset() {
    set(getInitialSettingsState());
  },
}));
