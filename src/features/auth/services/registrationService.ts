import { authService, normalizeApiError } from '../../../api';
import type {
  OtpChannel,
  OtpPurpose,
  RegisterNormalRequest,
  RegisterResponse,
  RegisterStudentRequest,
  SendOtpRequest,
  VerifyOtpRequest,
} from '../../../api';

const NETWORK_MESSAGE = 'تعذر الاتصال بالخادم. تحقق من اتصال الإنترنت.';
const GENERIC_MESSAGE = 'تعذر إكمال التسجيل. حاول مرة أخرى.';

export function toSafeRegistrationErrorMessage(error: unknown): string {
  const normalized = normalizeApiError(error);
  if (normalized.code === 'NETWORK_ERROR' || normalized.code === 'TIMEOUT') return NETWORK_MESSAGE;
  if (normalized.code === 'RATE_LIMITED') {
    const seconds = normalized.retryAfterSeconds;
    return seconds ? `انتظر ${seconds} ثانية ثم حاول مجددًا.` : 'تم تجاوز عدد المحاولات المسموح.';
  }
  if (normalized.fieldErrors) {
    const first = Object.values(normalized.fieldErrors).flat()[0];
    if (first) return first;
  }
  return normalized.message || GENERIC_MESSAGE;
}

export function registerStudentAccount(input: RegisterStudentRequest): Promise<RegisterResponse> {
  return authService.registerStudent({ ...input, otp_channel: input.otp_channel ?? 'email' });
}

export function registerNormalUser(input: RegisterNormalRequest): Promise<RegisterResponse> {
  return authService.registerNormal({ ...input, otp_channel: input.otp_channel ?? 'email' });
}

export async function sendRegistrationOtp({
  identifier,
  channel,
}: {
  identifier: string;
  channel: OtpChannel;
}) {
  const purpose: SendOtpRequest['purpose'] = channel === 'email' ? 'verify_email' : 'verify_phone';
  return authService.sendOtp({ identifier, channel, purpose });
}

export async function verifyRegistrationOtp({
  identifier,
  channel,
  code,
}: {
  identifier: string;
  channel: OtpChannel;
  code: string;
}) {
  const purpose: OtpPurpose = channel === 'email' ? 'verify_email' : 'verify_phone';
  const request: VerifyOtpRequest = { identifier, channel, purpose, code };
  return authService.verifyOtp(request);
}

export const toSafeD1ErrorMessage = toSafeRegistrationErrorMessage;
