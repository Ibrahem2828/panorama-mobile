import { authService, normalizeApiError } from '../../../api';
import type { ChangePasswordInput } from '../types';
import type { TranslationCatalog } from '../../../i18n';

type SettingsCatalog = TranslationCatalog['settings'];

export type ChangePasswordValidation = Partial<Record<keyof ChangePasswordInput, string>>;

export function validateChangePasswordInput(
  input: ChangePasswordInput,
  t: SettingsCatalog,
): ChangePasswordValidation {
  const validation: ChangePasswordValidation = {};

  if (!input.old_password.trim()) {
    validation.old_password = t.changePassword.currentRequired;
  }

  if (!input.new_password.trim()) {
    validation.new_password = t.changePassword.newRequired;
  } else if (input.new_password.length < 8) {
    validation.new_password = t.changePassword.tooShort;
  }

  if (!input.new_password_confirm.trim()) {
    validation.new_password_confirm = t.changePassword.confirmRequired;
  } else if (input.new_password !== input.new_password_confirm) {
    validation.new_password_confirm = t.changePassword.mismatch;
  }

  return validation;
}

export function hasChangePasswordValidationErrors(validation: ChangePasswordValidation): boolean {
  return Boolean(
    validation.old_password || validation.new_password || validation.new_password_confirm,
  );
}

export function toSafeSettingsErrorMessage(error: unknown, t: SettingsCatalog): string {
  const normalizedError = normalizeApiError(error);

  if (normalizedError.code === 'NETWORK_ERROR' || normalizedError.code === 'TIMEOUT') {
    return t.errors.network;
  }

  if (normalizedError.code === 'UNAUTHORIZED') {
    return t.errors.unauthorized;
  }

  if (normalizedError.code === 'VALIDATION_ERROR') {
    return t.errors.validation;
  }

  return normalizedError.message || t.errors.generic;
}

export async function changeCurrentPassword(
  input: ChangePasswordInput,
  authToken: string,
): Promise<void> {
  await authService.changePassword(input, authToken);
}
