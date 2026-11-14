import type { PhoneVerificationRequest } from '../../../../api';
import {
  classifyPhoneFailure,
  deriveView,
  formatCountdown,
  formatPhoneForDisplay,
  isCodeComplete,
  isOpenStatus,
  normalizePhoneInput,
  sanitizeCodeInput,
  secondsUntil,
  shouldRefreshAfterFailure,
  validatePhoneForm,
} from '../phoneVerificationLogic';

function request(overrides: Partial<PhoneVerificationRequest> = {}): PhoneVerificationRequest {
  return {
    id: 1,
    phone_number: '+963912345678',
    status: 'pending_staff',
    created_at: '2026-11-13T10:00:00Z',
    code_sent_at: null,
    expires_at: null,
    attempts_remaining: 5,
    rejection_reason: '',
    verified_at: null,
    ...overrides,
  };
}

describe('phone number input', () => {
  it.each([
    ['0912345678', '+963912345678'],
    ['912345678', '+963912345678'],
    ['963912345678', '+963912345678'],
    ['00963 912 345 678', '+963912345678'],
    ['+9630912345678', '+963912345678'],
    ['+963 (912) 345-678', '+963912345678'],
    ['٠٩١٢٣٤٥٦٧٨', '+963912345678'],
    ['+905321234567', '+905321234567'],
  ])('accepts %s', (raw, expected) => {
    expect(normalizePhoneInput(raw)).toBe(expected);
  });

  it.each([
    '',
    '   ',
    '12345',
    '0812345678',
    '09123',
    'abc',
    '+0123456789',
    '+12',
    '9123456789012345',
  ])('rejects %p', (raw) => {
    expect(normalizePhoneInput(raw)).toBeNull();
  });

  it('formats a Syrian number for reading', () => {
    expect(formatPhoneForDisplay('+963912345678')).toBe('+963 912 345 678');
    expect(formatPhoneForDisplay('+905321234567')).toBe('+905321234567');
  });

  it('validates the form: both fields, with the number normalised', () => {
    expect(validatePhoneForm({ phone: '', password: '' }).errors).toEqual({
      phone: 'required',
      password: 'required',
    });
    expect(validatePhoneForm({ phone: '123', password: 'x' }).errors).toEqual({ phone: 'invalid' });
    expect(validatePhoneForm({ phone: '0912345678', password: 'x' })).toEqual({
      errors: {},
      e164: '+963912345678',
    });
  });
});

describe('code input', () => {
  it('keeps six ASCII digits (Arabic-Indic digits are converted)', () => {
    expect(sanitizeCodeInput('12 34-56 78')).toBe('123456');
    expect(sanitizeCodeInput('١٢٣٤٥٦')).toBe('123456');
    expect(isCodeComplete('123456')).toBe(true);
    expect(isCodeComplete('12345')).toBe(false);
  });
});

describe('countdown', () => {
  const now = Date.parse('2026-11-13T10:00:00Z');

  it('counts whole seconds down to zero and never below', () => {
    expect(secondsUntil('2026-11-13T10:10:00Z', now)).toBe(600);
    expect(secondsUntil('2026-11-13T10:00:00.400Z', now)).toBe(1);
    expect(secondsUntil('2026-11-13T09:59:00Z', now)).toBe(0);
    expect(secondsUntil(null, now)).toBe(0);
    expect(secondsUntil('garbage', now)).toBe(0);
  });

  it('formats minutes and seconds', () => {
    expect(formatCountdown(600)).toBe('10:00');
    expect(formatCountdown(75)).toBe('1:15');
    expect(formatCountdown(9)).toBe('0:09');
    expect(formatCountdown(-4)).toBe('0:00');
  });
});

describe('view state machine', () => {
  const now = Date.parse('2026-11-13T10:00:00Z');

  it('shows the form when nothing was ever asked', () => {
    expect(deriveView(null, now)).toEqual({ kind: 'form', notice: 'none', rejectionReason: '' });
  });

  it('pending_staff -> waiting', () => {
    expect(deriveView(request(), now)).toEqual({ kind: 'waiting', phone: '+963912345678' });
  });

  it('code_sent -> code input with the 10-minute countdown and the attempts left', () => {
    expect(
      deriveView(
        request({
          status: 'code_sent',
          expires_at: '2026-11-13T10:10:00Z',
          attempts_remaining: 3,
        }),
        now,
      ),
    ).toEqual({
      kind: 'code',
      phone: '+963912345678',
      remainingSeconds: 600,
      attemptsRemaining: 3,
      lapsed: false,
    });
  });

  it('a code whose time ran out on the device is flagged, not hidden (the server decides)', () => {
    expect(
      deriveView(request({ status: 'code_sent', expires_at: '2026-11-13T09:00:00Z' }), now),
    ).toMatchObject({ kind: 'code', remainingSeconds: 0, lapsed: true });
  });

  it('verified -> success', () => {
    expect(deriveView(request({ status: 'verified' }), now)).toEqual({
      kind: 'verified',
      phone: '+963912345678',
    });
  });

  it.each([
    ['expired', 'expired'],
    ['cancelled', 'none'],
    ['rejected', 'rejected'],
  ] as const)('%s -> form with notice %s', (status, notice) => {
    expect(deriveView(request({ status, rejection_reason: 'no' }), now)).toMatchObject({
      kind: 'form',
      notice,
    });
  });

  it('knows which statuses are open', () => {
    expect(isOpenStatus('pending_staff')).toBe(true);
    expect(isOpenStatus('code_sent')).toBe(true);
    expect(isOpenStatus('verified')).toBe(false);
    expect(isOpenStatus(undefined)).toBe(false);
  });
});

describe('failures', () => {
  it.each([
    [{ errorCode: 'PASSWORD_INCORRECT', status: 400 }, 'password_incorrect'],
    [{ errorCode: 'PHONE_NUMBER_INVALID', status: 400 }, 'phone_invalid'],
    [{ errorCode: 'PHONE_NUMBER_IN_USE', status: 409 }, 'phone_in_use'],
    [{ errorCode: 'PHONE_VERIFICATION_ALREADY_OPEN', status: 409 }, 'already_open'],
    [{ errorCode: 'PHONE_ALREADY_VERIFIED', status: 409 }, 'already_verified'],
    [{ errorCode: 'PHONE_CODE_ATTEMPTS_EXCEEDED', status: 400 }, 'attempts_exceeded'],
    [{ errorCode: 'PHONE_CODE_EXPIRED', status: 400 }, 'code_expired'],
    [{ errorCode: 'PHONE_CODE_NOT_SENT', status: 409 }, 'code_not_sent'],
    [{ status: 404, code: 'NOT_FOUND' }, 'not_found'],
    [{ code: 'RATE_LIMITED', status: 429 }, 'rate_limited'],
    [{ code: 'NETWORK_ERROR' }, 'network'],
    [{ code: 'SERVER_ERROR', status: 500 }, 'generic'],
  ])('%j -> %s', (input, kind) => {
    expect(classifyPhoneFailure(input).kind).toBe(kind);
  });

  it('carries the attempts left from a wrong code', () => {
    expect(
      classifyPhoneFailure({ errorCode: 'PHONE_CODE_INVALID', details: { attempts_remaining: 2 } }),
    ).toEqual({ kind: 'code_invalid', attemptsRemaining: 2 });
    expect(classifyPhoneFailure({ errorCode: 'PHONE_CODE_INVALID' })).toEqual({
      kind: 'code_invalid',
      attemptsRemaining: null,
    });
  });

  it('re-reads the server after a failure that means the local copy is stale', () => {
    expect(shouldRefreshAfterFailure({ kind: 'already_open' })).toBe(true);
    expect(shouldRefreshAfterFailure({ kind: 'attempts_exceeded' })).toBe(true);
    expect(shouldRefreshAfterFailure({ kind: 'code_invalid', attemptsRemaining: 2 })).toBe(false);
    expect(shouldRefreshAfterFailure({ kind: 'password_incorrect' })).toBe(false);
  });
});
