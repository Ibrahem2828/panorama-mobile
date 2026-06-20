import { authService, normalizeApiError } from '../../../api';
import type {
  OtpPurpose,
  RegisterStudentRequest,
  SendOtpRequest,
  VerifyOtpRequest,
} from '../../../api';

const NETWORK_MESSAGE = 'تعذر الاتصال بالخادم. تحقق من اتصال الإنترنت.';
const GENERIC_MESSAGE = 'تعذر إكمال التسجيل. حاول مرة أخرى.';

export function toSafeRegistrationErrorMessage(error: unknown): string {
  const normalized = normalizeApiError(error);

  if (normalized.code === 'NETWORK_ERROR' || normalized.code === 'TIMEOUT') {
    return NETWORK_MESSAGE;
  }

  return normalized.message || GENERIC_MESSAGE;
}

export async function registerStudentAccount(input: RegisterStudentRequest) {
  return authService.registerStudent(input);
}

export async function sendRegistrationOtp(phoneNumber: string) {
  const request: SendOtpRequest = {
    phone_number: phoneNumber,
    purpose: 'verify_phone',
  };

  return authService.sendOtp(request);
}

export async function verifyRegistrationOtp(phoneNumber: string, code: string) {
  const request: VerifyOtpRequest = {
    phone_number: phoneNumber,
    purpose: 'verify_phone',
    code,
  };

  return authService.verifyOtp(request);
}

export type { OtpPurpose };
