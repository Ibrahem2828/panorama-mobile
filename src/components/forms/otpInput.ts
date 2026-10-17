/** Pure helpers behind the six-box one-time-code input. */

export const OTP_LENGTH = 6;

const ARABIC_INDIC_ZERO = 0x0660;
const EXTENDED_ARABIC_INDIC_ZERO = 0x06f0;

/** Keeps digits only (Arabic-Indic digits are converted) and caps the length. Handles typing, paste and SMS autofill alike. */
export function sanitizeOtp(text: string, length: number = OTP_LENGTH): string {
  const ascii = text
    .replace(/[٠-٩]/gu, (digit) => String(digit.charCodeAt(0) - ARABIC_INDIC_ZERO))
    .replace(/[۰-۹]/gu, (digit) => String(digit.charCodeAt(0) - EXTENDED_ARABIC_INDIC_ZERO));

  return ascii.replace(/\D/gu, '').slice(0, length);
}

export function isOtpComplete(value: string, length: number = OTP_LENGTH): boolean {
  return value.length === length && /^\d+$/u.test(value);
}

/** The box that should show the caret: the first empty one, or the last when the code is full. */
export function activeOtpIndex(value: string, length: number = OTP_LENGTH): number {
  return Math.min(value.length, length - 1);
}

/** One entry per box, empty string for boxes not yet filled. */
export function otpBoxes(value: string, length: number = OTP_LENGTH): string[] {
  return Array.from({ length }, (_, index) => value[index] ?? '');
}
