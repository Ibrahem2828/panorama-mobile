import { apiClient, authService, endpoints, normalizeApiError } from '../../../api';
import type {
  NormalRegisterPayload,
  NormalRegisterResponse,
  OtpPurpose,
  RegisterStudentRequest,
  SendOtpRequest,
  StudentAccountRequestPayload,
  StudentAccountRequestResponse,
  StudentAccountRequestStatusResponse,
  StudentVerifyOtpPayload,
  StudentVerifyOtpResponse,
  VerifyOtpRequest,
  VerifyPhonePayload,
  VerifyPhoneResponse,
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

// ============================================
// D1: Normal user + Student Account Request flows
// ============================================

const D1_NETWORK = 'تعذر الاتصال بالخادم. تحقق من الإنترنت.';
const D1_GENERIC = 'حدث خطأ غير متوقع. حاول مرة أخرى.';

export function toSafeD1ErrorMessage(error: unknown): string {
  const normalized = normalizeApiError(error);
  if (normalized.code === 'NETWORK_ERROR' || normalized.code === 'TIMEOUT') {
    return D1_NETWORK;
  }
  return normalized.message || D1_GENERIC;
}

export async function registerNormalUser(
  payload: NormalRegisterPayload,
): Promise<NormalRegisterResponse> {
  return apiClient.post<NormalRegisterResponse, NormalRegisterPayload>(
    endpoints.auth.registerNormal,
    payload,
  );
}

export async function verifyPhoneOtp(payload: VerifyPhonePayload): Promise<VerifyPhoneResponse> {
  // Backend accepts both /verify-phone/ and /otp/verify/. Use the canonical verifyOtp path.
  return apiClient.post<VerifyPhoneResponse, VerifyPhonePayload>(endpoints.auth.verifyOtp, {
    phone_number: payload.phone_number,
    purpose: 'verify_phone',
    code: payload.code,
  } as VerifyOtpRequest);
}

export async function submitStudentAccountRequest(
  payload: StudentAccountRequestPayload,
  cardFile: { uri: string; name: string; type: string },
): Promise<StudentAccountRequestResponse> {
  const formData = new FormData() as FormData & {
    append(
      name: string,
      value: string | Blob | { uri: string; name?: string; type?: string },
    ): void;
  };

  // Append text fields
  formData.append('full_name', payload.full_name);
  if (payload.email) formData.append('email', payload.email);
  formData.append('phone_number', payload.phone_number);
  if (payload.whatsapp_phone) formData.append('whatsapp_phone', payload.whatsapp_phone);
  formData.append('university', payload.university);
  if (payload.faculty) formData.append('faculty', payload.faculty);
  if (payload.major) formData.append('major', payload.major);
  formData.append('student_number', payload.student_number);
  formData.append('password', payload.password);
  formData.append('password_confirm', payload.password_confirm);

  // University card
  formData.append('university_card', {
    uri: cardFile.uri,
    name: cardFile.name,
    type: cardFile.type,
  });

  return apiClient.post<StudentAccountRequestResponse, FormData>(
    endpoints.auth.studentAccountRequests,
    formData,
  );
}

export async function getStudentAccountRequestStatus(
  requestId: string | number,
): Promise<StudentAccountRequestStatusResponse> {
  return apiClient.get<StudentAccountRequestStatusResponse>(
    endpoints.auth.studentAccountRequestStatus(requestId),
  );
}

export async function verifyStudentAccountOtp(
  requestId: string | number,
  payload: StudentVerifyOtpPayload,
): Promise<StudentVerifyOtpResponse> {
  return apiClient.post<StudentVerifyOtpResponse, StudentVerifyOtpPayload>(
    endpoints.auth.studentAccountRequestVerifyOtp(requestId),
    payload,
  );
}

export type { OtpPurpose };
