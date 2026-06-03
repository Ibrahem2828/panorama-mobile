import { authService, normalizeApiError } from '../../../api';
import type { ChangePasswordInput } from '../types';

export type ChangePasswordValidation = Partial<Record<keyof ChangePasswordInput, string>>;

const NETWORK_MESSAGE = 'تعذر تغيير كلمة المرور. تحقق من اتصال الإنترنت وحاول مرة أخرى.';
const UNAUTHORIZED_MESSAGE = 'انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى.';
const VALIDATION_MESSAGE = 'يرجى التأكد من بيانات كلمة المرور المدخلة.';
const GENERIC_MESSAGE = 'تعذر تغيير كلمة المرور. حاول مرة أخرى.';

const OLD_PASSWORD_REQUIRED_MESSAGE = 'يرجى إدخال كلمة المرور الحالية.';
const NEW_PASSWORD_REQUIRED_MESSAGE = 'يرجى إدخال كلمة المرور الجديدة.';
const CONFIRM_PASSWORD_REQUIRED_MESSAGE = 'يرجى تأكيد كلمة المرور الجديدة.';
const PASSWORD_LENGTH_MESSAGE = 'يجب أن تكون كلمة المرور الجديدة 8 أحرف على الأقل.';
const PASSWORD_MISMATCH_MESSAGE = 'كلمتا المرور غير متطابقتين.';

export function validateChangePasswordInput(input: ChangePasswordInput): ChangePasswordValidation {
  const validation: ChangePasswordValidation = {};

  if (!input.old_password.trim()) {
    validation.old_password = OLD_PASSWORD_REQUIRED_MESSAGE;
  }

  if (!input.new_password.trim()) {
    validation.new_password = NEW_PASSWORD_REQUIRED_MESSAGE;
  } else if (input.new_password.length < 8) {
    validation.new_password = PASSWORD_LENGTH_MESSAGE;
  }

  if (!input.new_password_confirm.trim()) {
    validation.new_password_confirm = CONFIRM_PASSWORD_REQUIRED_MESSAGE;
  } else if (input.new_password !== input.new_password_confirm) {
    validation.new_password_confirm = PASSWORD_MISMATCH_MESSAGE;
  }

  return validation;
}

export function hasChangePasswordValidationErrors(validation: ChangePasswordValidation): boolean {
  return Boolean(
    validation.old_password || validation.new_password || validation.new_password_confirm,
  );
}

export function toSafeSettingsErrorMessage(error: unknown): string {
  const normalizedError = normalizeApiError(error);

  if (normalizedError.code === 'NETWORK_ERROR' || normalizedError.code === 'TIMEOUT') {
    return NETWORK_MESSAGE;
  }

  if (normalizedError.code === 'UNAUTHORIZED') {
    return UNAUTHORIZED_MESSAGE;
  }

  if (normalizedError.code === 'VALIDATION_ERROR') {
    return VALIDATION_MESSAGE;
  }

  return normalizedError.message || GENERIC_MESSAGE;
}

export async function changeCurrentPassword(
  input: ChangePasswordInput,
  authToken: string,
): Promise<void> {
  await authService.changePassword(input, authToken);
}
