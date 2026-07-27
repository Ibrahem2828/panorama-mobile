import { authService, normalizeApiError } from '../../../api';
import type { ConfirmPasswordResetRequest, OtpChannel } from '../../../api';

const NETWORK_MESSAGE = 'تعذر الاتصال بالخادم. تحقق من اتصال الإنترنت.';
const GENERIC_MESSAGE = 'تعذر استعادة كلمة المرور. حاول مرة أخرى.';

export function toSafePasswordResetErrorMessage(error: unknown): string {
  const normalized = normalizeApiError(error);
  if (normalized.code === 'NETWORK_ERROR' || normalized.code === 'TIMEOUT') return NETWORK_MESSAGE;
  if (normalized.code === 'RATE_LIMITED') return 'تم تجاوز عدد المحاولات. حاول لاحقًا.';
  return normalized.message || GENERIC_MESSAGE;
}

export async function requestPasswordResetCode(identifier: string, channel: OtpChannel = 'email') {
  return authService.requestPasswordReset({ identifier, channel });
}

export async function confirmPasswordReset(input: ConfirmPasswordResetRequest) {
  return authService.confirmPasswordReset(input);
}
