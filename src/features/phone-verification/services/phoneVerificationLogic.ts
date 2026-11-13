import type { PhoneVerificationRequest, PhoneVerificationStatus } from '../../../api';

/**
 * Pure rules of the "verify my phone number" flow (WhatsApp code). Nothing here touches the network, storage or React,
 * so every rule has a plain unit test.
 */

export const PHONE_CODE_LENGTH = 6;
/** While a request is open the app re-reads its status this often (and on focus, foreground and push). */
export const PHONE_POLL_INTERVAL_MS = 15_000;

const ARABIC_INDIC_ZERO = 0x0660;
const EXTENDED_ARABIC_INDIC_ZERO = 0x06f0;

function toAsciiDigits(text: string): string {
  return text
    .replace(/[٠-٩]/gu, (digit) => String(digit.charCodeAt(0) - ARABIC_INDIC_ZERO))
    .replace(/[۰-۹]/gu, (digit) => String(digit.charCodeAt(0) - EXTENDED_ARABIC_INDIC_ZERO));
}

/**
 * The same acceptance rules as the server: `0912345678`, `912345678`, `963912345678`, `00963 912 345 678`,
 * `+9630912345678`, Arabic-Indic digits and common separators all become `+963912345678`. Another country needs a
 * leading `+` or `00`. Returns null when the number cannot be valid (the server stays the authority).
 */
export function normalizePhoneInput(raw: string): string | null {
  const cleaned = toAsciiDigits(String(raw ?? '')).replace(/[\s\-().‎‏]/gu, '');

  if (!cleaned) return null;

  let value = cleaned;
  if (value.startsWith('00')) value = `+${value.slice(2)}`;

  let digits: string;
  if (value.startsWith('+')) digits = value.slice(1);
  else if (value.startsWith('963')) digits = value;
  else if (value.startsWith('0')) digits = `963${value.slice(1)}`;
  else if (value.length === 9 && value.startsWith('9')) digits = `963${value}`;
  else return null;

  if (!/^\d+$/u.test(digits) || digits.startsWith('0')) return null;

  if (digits.startsWith('963')) {
    // +9630912... is a common typo for +963912...
    const national = digits.slice(3).replace(/^0+/u, '');
    return /^9\d{8}$/u.test(national) ? `+963${national}` : null;
  }

  return digits.length >= 8 && digits.length <= 15 ? `+${digits}` : null;
}

/** "+963912345678" -> "+963 912 345 678" for display. */
export function formatPhoneForDisplay(e164: string): string {
  const match = /^\+963(\d{3})(\d{3})(\d{3})$/u.exec(e164);

  return match ? `+963 ${match[1]} ${match[2]} ${match[3]}` : e164;
}

export type PhoneFormErrors = { phone?: 'required' | 'invalid'; password?: 'required' };

export function validatePhoneForm(input: { phone: string; password: string }): {
  errors: PhoneFormErrors;
  e164: string | null;
} {
  const errors: PhoneFormErrors = {};
  const trimmed = input.phone.trim();
  const e164 = trimmed ? normalizePhoneInput(trimmed) : null;

  if (!trimmed) errors.phone = 'required';
  else if (!e164) errors.phone = 'invalid';

  if (!input.password) errors.password = 'required';

  return { errors, e164 };
}

export function sanitizeCodeInput(text: string): string {
  return toAsciiDigits(text).replace(/\D/gu, '').slice(0, PHONE_CODE_LENGTH);
}

export function isCodeComplete(code: string): boolean {
  return /^\d{6}$/u.test(code);
}

/** Whole seconds until `expiresAt` (0 once passed, or when the date is missing or unreadable). */
export function secondsUntil(expiresAt: string | null | undefined, now: number): number {
  if (!expiresAt) return 0;

  const target = new Date(expiresAt).getTime();

  return Number.isNaN(target) ? 0 : Math.max(0, Math.ceil((target - now) / 1000));
}

/** 600 -> "10:00", 75 -> "1:15". */
export function formatCountdown(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));

  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`;
}

const OPEN_STATUSES: readonly PhoneVerificationStatus[] = ['pending_staff', 'code_sent'];

export function isOpenStatus(status: PhoneVerificationStatus | null | undefined): boolean {
  return status !== null && status !== undefined && OPEN_STATUSES.includes(status);
}

/** What the screen shows. `form` covers "never asked" and every closed outcome (with a notice for the closed ones). */
export type PhoneVerificationView =
  | { kind: 'form'; notice: 'none' | 'expired' | 'rejected'; rejectionReason: string }
  | { kind: 'waiting'; phone: string }
  | {
      kind: 'code';
      phone: string;
      remainingSeconds: number;
      attemptsRemaining: number;
      lapsed: boolean;
    }
  | { kind: 'verified'; phone: string };

export function deriveView(
  request: PhoneVerificationRequest | null,
  now: number,
): PhoneVerificationView {
  if (!request) return { kind: 'form', notice: 'none', rejectionReason: '' };

  switch (request.status) {
    case 'pending_staff':
      return { kind: 'waiting', phone: request.phone_number };
    case 'code_sent': {
      const remainingSeconds = secondsUntil(request.expires_at, now);

      return {
        kind: 'code',
        phone: request.phone_number,
        remainingSeconds,
        attemptsRemaining: Math.max(0, request.attempts_remaining),
        // The device clock says the code ran out; the server decides (clocks differ), so the input stays usable.
        lapsed: remainingSeconds <= 0,
      };
    }
    case 'verified':
      return { kind: 'verified', phone: request.phone_number };
    case 'expired':
      return { kind: 'form', notice: 'expired', rejectionReason: '' };
    case 'rejected':
      return { kind: 'form', notice: 'rejected', rejectionReason: request.rejection_reason ?? '' };
    default:
      // cancelled, or a status a newer server added: start over quietly.
      return { kind: 'form', notice: 'none', rejectionReason: '' };
  }
}

/** The user-visible outcome of a failed call; the screen maps it to wording. */
export type PhoneFailure =
  | { kind: 'password_incorrect' }
  | { kind: 'phone_invalid' }
  | { kind: 'phone_in_use' }
  | { kind: 'already_open' }
  | { kind: 'already_verified' }
  | { kind: 'code_invalid'; attemptsRemaining: number | null }
  | { kind: 'attempts_exceeded' }
  | { kind: 'code_expired' }
  | { kind: 'code_not_sent' }
  | { kind: 'not_found' }
  | { kind: 'rate_limited'; retryAfterSeconds: number | null }
  | { kind: 'network' }
  | { kind: 'generic' };

export function classifyPhoneFailure(input: {
  code?: string;
  errorCode?: string;
  status?: number;
  details?: Record<string, unknown>;
  retryAfterSeconds?: number;
}): PhoneFailure {
  switch (input.errorCode) {
    case 'PASSWORD_INCORRECT':
      return { kind: 'password_incorrect' };
    case 'PHONE_NUMBER_INVALID':
      return { kind: 'phone_invalid' };
    case 'PHONE_NUMBER_IN_USE':
      return { kind: 'phone_in_use' };
    case 'PHONE_VERIFICATION_ALREADY_OPEN':
      return { kind: 'already_open' };
    case 'PHONE_ALREADY_VERIFIED':
      return { kind: 'already_verified' };
    case 'PHONE_CODE_INVALID': {
      const remaining = Number(input.details?.attempts_remaining);

      return {
        kind: 'code_invalid',
        attemptsRemaining: Number.isFinite(remaining) ? remaining : null,
      };
    }
    case 'PHONE_CODE_ATTEMPTS_EXCEEDED':
      return { kind: 'attempts_exceeded' };
    case 'PHONE_CODE_EXPIRED':
      return { kind: 'code_expired' };
    case 'PHONE_CODE_NOT_SENT':
      return { kind: 'code_not_sent' };
    case 'PHONE_VERIFICATION_NOT_FOUND':
      return { kind: 'not_found' };
    default:
      break;
  }

  if (input.status === 404) return { kind: 'not_found' };
  if (input.code === 'RATE_LIMITED' || input.status === 429) {
    return { kind: 'rate_limited', retryAfterSeconds: input.retryAfterSeconds ?? null };
  }
  if (input.code === 'NETWORK_ERROR' || input.code === 'TIMEOUT') return { kind: 'network' };

  return { kind: 'generic' };
}

/** After these the local copy is stale: re-read the server's request instead of trusting what the screen holds. */
export function shouldRefreshAfterFailure(failure: PhoneFailure): boolean {
  return (
    failure.kind === 'already_open' ||
    failure.kind === 'already_verified' ||
    failure.kind === 'attempts_exceeded' ||
    failure.kind === 'code_expired' ||
    failure.kind === 'code_not_sent' ||
    failure.kind === 'not_found'
  );
}

export function isPhoneVerificationPush(data: Record<string, unknown> | null | undefined): boolean {
  return data?.kind === 'phone_verification';
}
