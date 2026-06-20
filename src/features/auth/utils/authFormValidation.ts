const PHONE_PATTERN = /^\+?[0-9]{8,15}$/u;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim());
}

export function isValidPhoneNumber(value: string): boolean {
  const normalized = value.trim().replace(/[\s-]/gu, '');

  return PHONE_PATTERN.test(normalized);
}

export function normalizePhoneNumber(value: string): string {
  return value.trim().replace(/[\s-]/gu, '');
}

export function validatePasswordPair(password: string, confirmPassword: string): string | null {
  if (password.length < 8) {
    return 'كلمة المرور يجب أن تكون 8 أحرف على الأقل.';
  }

  if (password !== confirmPassword) {
    return 'تأكيد كلمة المرور غير مطابق.';
  }

  return null;
}

export function validateOtpCode(code: string): string | null {
  const normalized = code.trim();

  if (!/^\d{4,8}$/u.test(normalized)) {
    return 'أدخل رمز تحقق صالحاً.';
  }

  return null;
}
