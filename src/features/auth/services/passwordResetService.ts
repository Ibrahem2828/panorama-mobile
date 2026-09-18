import { authService, normalizeApiError } from '../../../api';
import type { ConfirmPasswordResetRequest, OtpChannel } from '../../../api';
import type { AuthErrorMessages } from '../types';

export function toSafePasswordResetErrorMessage(
  error: unknown,
  messages: AuthErrorMessages,
): string {
  const normalized = normalizeApiError(error);
  if (normalized.code === 'NETWORK_ERROR' || normalized.code === 'TIMEOUT') return messages.network;
  if (normalized.code === 'RATE_LIMITED') return messages.passwordResetRateLimited;
  return normalized.message || messages.passwordResetGeneric;
}

export async function requestPasswordResetCode(identifier: string, channel: OtpChannel = 'email') {
  return authService.requestPasswordReset({ identifier, channel });
}

export async function confirmPasswordReset(input: ConfirmPasswordResetRequest) {
  return authService.confirmPasswordReset(input);
}
