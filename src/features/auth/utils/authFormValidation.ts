const PHONE_PATTERN = /^\+[0-9]{8,15}$/u;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;

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

export function validatePhoneNumber(value: string): string | null {
  const cleaned = value.trim().replace(/[\s-]/gu, '');
  if (!cleaned) return 'يرجى إدخال رقم الجوال.';
  if (!cleaned.startsWith('+')) return 'صيغة رقم الجوال غير صحيحة. يجب أن يبدأ بمفتاح الدولة.';
  const digits = cleaned.slice(1);
  if (!/^\d+$/u.test(digits)) return 'رقم الجوال يجب أن يحتوي على أرقام فقط.';
  if (digits.length < 8)
    return 'رقم الجوال قصير جداً. يجب أن يتكون من 8 أرقام على الأقل بعد مفتاح الدولة.';
  if (digits.length > 15) return 'رقم الجوال طويل جداً.';
  return null;
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
