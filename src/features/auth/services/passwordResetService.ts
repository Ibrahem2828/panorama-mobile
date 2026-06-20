import { authService, normalizeApiError } from '../../../api';
import type { ConfirmPasswordResetRequest, RequestPasswordResetRequest } from '../../../api';

const NETWORK_MESSAGE = 'تعذر الاتصال بالخادم. تحقق من اتصال الإنترنت.';
const GENERIC_MESSAGE = 'تعذر استعادة كلمة المرور. حاول مرة أخرى.';

export function toSafePasswordResetErrorMessage(error: unknown): string {
  const normalized = normalizeApiError(error);

  if (normalized.code === 'NETWORK_ERROR' || normalized.code === 'TIMEOUT') {
    return NETWORK_MESSAGE;
  }

  return normalized.message || GENERIC_MESSAGE;
}

export async function requestPasswordResetCode(phoneNumber: string) {
  const request: RequestPasswordResetRequest = { phone_number: phoneNumber };

  return authService.requestPasswordReset(request);
}

export async function confirmPasswordReset(input: ConfirmPasswordResetRequest) {
  return authService.confirmPasswordReset(input);
}
