import type { NormalizedApiError } from '../../../api';
import type { AuthErrorMessages } from '../types';

/**
 * The backend answers OTP failures with English field errors. Map the known ones to the
 * active locale so Arabic users never read a raw English message on the verification step.
 */
export function localizeOtpError(
  normalized: NormalizedApiError,
  messages: AuthErrorMessages,
): string | null {
  if (normalized.status === 503) return messages.otpUnavailable;
  const text = normalized.fieldErrors?.code?.[0] ?? '';
  if (/too many invalid attempts/iu.test(text)) return messages.otpLocked;
  if (/invalid or expired/iu.test(text)) return messages.otpInvalid;
  return null;
}
