jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { extra: { apiBaseUrl: 'https://api.example.com' } } },
}));

import { localizeOtpError } from '../otpErrors';
import { toSafeRegistrationErrorMessage } from '../registrationService';
import { toSafePasswordResetErrorMessage } from '../passwordResetService';
import { createApiError } from '../../../../api';
import { ar } from '../../../../i18n/locales/ar';

const messages = ar.auth.errors;

describe('OTP error localisation', () => {
  it('maps a delivery outage (503) to the localized message', () => {
    const error = createApiError({
      status: 503,
      message: 'OTP delivery is temporarily unavailable.',
    });
    expect(localizeOtpError(error, messages)).toBe(messages.otpUnavailable);
    expect(toSafeRegistrationErrorMessage(error, messages)).toBe(messages.otpUnavailable);
    expect(toSafePasswordResetErrorMessage(error, messages)).toBe(messages.otpUnavailable);
  });

  it('maps invalid/expired and locked codes', () => {
    const invalid = createApiError({
      status: 400,
      fieldErrors: { code: ['Invalid or expired OTP code.'] },
    });
    const locked = createApiError({
      status: 400,
      fieldErrors: { code: ['Too many invalid attempts. Request a new code.'] },
    });
    expect(toSafeRegistrationErrorMessage(invalid, messages)).toBe(messages.otpInvalid);
    expect(toSafeRegistrationErrorMessage(locked, messages)).toBe(messages.otpLocked);
  });

  it('leaves unrelated errors untouched', () => {
    const error = createApiError({ status: 400, fieldErrors: { email: ['Already used'] } });
    expect(localizeOtpError(error, messages)).toBeNull();
  });
});
