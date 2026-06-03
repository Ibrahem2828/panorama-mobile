import { create } from 'zustand';

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
};

const EMPTY_PASSWORD_DRAFT: ChangePasswordDraft = {
  old_password: '',
  new_password: '',
  new_password_confirm: '',
};

const MISSING_SESSION_MESSAGE = 'انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى.';
const PASSWORD_SUCCESS_MESSAGE = 'تم تغيير كلمة المرور بنجاح.';

function getAccessToken(): string | null {
  return useAuthStore.getState().accessToken;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  passwordDraft: EMPTY_PASSWORD_DRAFT,
  passwordValidation: {},
  isChangingPassword: false,
  errorMessage: null,
  successMessage: null,

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
    const validation = validateChangePasswordInput(passwordDraft);

    set({ passwordValidation: validation });

    if (hasChangePasswordValidationErrors(validation)) {
      return false;
    }

    const accessToken = getAccessToken();

    if (!accessToken) {
      set({ errorMessage: MISSING_SESSION_MESSAGE });
      return false;
    }

    set({ isChangingPassword: true, errorMessage: null, successMessage: null });

    try {
      await changeCurrentPassword(passwordDraft, accessToken);
      set({
        passwordDraft: EMPTY_PASSWORD_DRAFT,
        passwordValidation: {},
        isChangingPassword: false,
        successMessage: PASSWORD_SUCCESS_MESSAGE,
      });
      return true;
    } catch (error) {
      set({
        isChangingPassword: false,
        errorMessage: toSafeSettingsErrorMessage(error),
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
}));
