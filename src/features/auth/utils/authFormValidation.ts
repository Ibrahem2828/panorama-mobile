import type { TranslationCatalog } from '../../../i18n';

const PHONE_PATTERN = /^\+[0-9]{8,15}$/u;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;

/**
 * Validators take the catalog rather than importing it, so they stay pure and testable
 * and do not couple form rules to whichever locale happens to be active.
 */
type Messages = TranslationCatalog['auth']['validation'];

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim());
}

export function isValidPhoneNumber(value: string): boolean {
  const normalized = value.trim().replace(/[\s-]/gu, '');

  return PHONE_PATTERN.test(normalized);
}

export function normalizePhoneNumber(value: string): string {
  const cleaned = value.trim().replace(/[\s-]/gu, '');
  // Normalize Syrian local mobile numbers (09xxxxxxxx) to international format (+9639xxxxxxx)
  if (/^09\d{8}$/u.test(cleaned)) {
    return '+963' + cleaned.slice(1);
  }
  return cleaned;
}

export function validatePhoneNumber(value: string, messages: Messages): string | null {
  const cleaned = value.trim().replace(/[\s-]/gu, '');
  if (!cleaned) return messages.phoneRequired;
  if (!cleaned.startsWith('+')) return messages.phoneFormat;
  const digits = cleaned.slice(1);
  if (!/^\d+$/u.test(digits)) return messages.phoneDigitsOnly;
  if (digits.length < 8) return messages.phoneTooShort;
  if (digits.length > 15) return messages.phoneTooLong;
  return null;
}

export function validatePasswordPair(
  password: string,
  confirmPassword: string,
  messages: Messages,
): string | null {
  if (password.length < 8) {
    return messages.passwordTooShort;
  }

  if (password !== confirmPassword) {
    return messages.passwordMismatch;
  }

  return null;
}

export function validateOtpCode(code: string, messages: Messages): string | null {
  const normalized = code.trim();

  if (!/^\d{4,8}$/u.test(normalized)) {
    return messages.otpInvalid;
  }

  return null;
}
