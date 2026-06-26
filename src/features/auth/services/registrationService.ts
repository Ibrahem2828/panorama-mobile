import { apiClient, authService, endpoints, normalizeApiError } from '../../../api';
import type {
  NormalRegisterPayload,
  NormalRegisterResponse,
  NormalizedApiError,
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
// D1/D2: Normal user + Student Account Request flows
// ============================================

const D1_NETWORK = 'تعذر الاتصال بالخادم. تحقق من الإنترنت وحاول مرة أخرى.';
const D1_TIMEOUT = 'استغرق الاتصال وقتاً أطول من المتوقع. حاول مرة أخرى.';
const D1_GENERIC = 'حدث خطأ غير متوقع. حاول مرة أخرى.';

const D1_ERROR_MAP: Record<string, string> = {
  duplicate_phone: 'رقم الجوال مستخدم مسبقاً.',
  duplicate_email: 'البريد الإلكتروني مستخدم مسبقاً.',
  invalid_phone: 'صيغة رقم الجوال غير صحيحة. استخدم مثالاً مثل: +963994109259.',
  invalid_email: 'صيغة البريد الإلكتروني غير صحيحة.',
  password_mismatch: 'كلمتا المرور غير متطابقتين.',
  weak_password: 'كلمة المرور ضعيفة. استخدم كلمة مرور أقوى.',
  file_required: 'يرجى إرفاق صورة البطاقة الجامعية.',
  invalid_file: 'تعذر استخدام هذا الملف. اختر صورة أخرى.',
  invalid_otp: 'رمز التحقق غير صحيح.',
  expired_otp: 'انتهت صلاحية رمز التحقق.',
  too_many_attempts: 'تم تجاوز عدد المحاولات المسموح. حاول لاحقاً.',
  too_many_otp_attempts: 'تم تجاوز عدد المحاولات المسموح. حاول لاحقاً.',
  resend_cooldown: 'انتظر قليلاً قبل طلب رمز جديد.',
  not_approved_yet: 'لم تتم الموافقة على الطلب بعد.',
  request_not_approved: 'لم تتم الموافقة على الطلب بعد.',
  request_not_found: 'الطلب غير موجود.',
  validation_error: 'تحقق من البيانات المدخلة وحاول مرة أخرى.',
  server_error: 'الخدمة غير متاحة حالياً. حاول لاحقاً.',
  forbidden: 'لا تملك صلاحية تنفيذ هذا الإجراء.',
  server_unavailable: 'الخدمة غير متاحة حالياً. حاول لاحقاً.',
};

function formatRetryAfter(seconds?: number): string {
  if (!seconds || seconds <= 0) return 'قليل';
  const minutes = Math.ceil(seconds / 60);
  if (minutes === 1) return 'دقيقة واحدة';
  if (minutes === 2) return 'دقيقتين';
  return `${minutes} دقيقة`;
}

export function toSafeD1ErrorMessage(error: unknown): string {
  const normalized = normalizeApiError(error);

  if (normalized.code === 'NETWORK_ERROR') {
    return D1_NETWORK;
  }

  if (normalized.code === 'TIMEOUT') {
    return D1_TIMEOUT;
  }

  if (normalized.code === 'RATE_LIMITED') {
    const retryText = formatRetryAfter(normalized.retryAfterSeconds);
    return `تم تجاوز عدد المحاولات المسموح. حاول مرة أخرى بعد ${retryText}.`;
  }

  const mapped = mapD1Error(normalized);
  if (mapped) return mapped;

  return D1_GENERIC;
}

function mapD1Error(normalized: NormalizedApiError): string | null {
  // Direct backend error_code mapping (most reliable)
  if (normalized.errorCode) {
    const mapped = D1_ERROR_MAP[normalized.errorCode as keyof typeof D1_ERROR_MAP];
    if (mapped) return mapped;
  }

  const message = (normalized.message || '').toLowerCase();
  const technical = (normalized.technicalMessage || '').toLowerCase();
  const combined = `${message} ${technical}`;
  const m = (key: keyof typeof D1_ERROR_MAP): string => D1_ERROR_MAP[key] as string;

  if (
    message.includes('duplicate') ||
    message.includes('already exists') ||
    message.includes('مسجل')
  ) {
    if (combined.includes('phone') || combined.includes('جوال') || combined.includes('رقم')) {
      return m('duplicate_phone');
    }
    if (combined.includes('email') || combined.includes('بريد')) {
      return m('duplicate_email');
    }
    return 'البيانات المدخلة مسجلة مسبقاً.';
  }

  if (
    combined.includes('invalid_otp') ||
    combined.includes('invalid otp') ||
    combined.includes('رمز التحقق غير صحيح') ||
    combined.includes('incorrect otp') ||
    combined.includes('wrong otp')
  ) {
    return m('invalid_otp');
  }

  if (
    combined.includes('expired_otp') ||
    combined.includes('expired otp') ||
    combined.includes('انتهت صلاحية') ||
    combined.includes('otp expired')
  ) {
    return m('expired_otp');
  }

  if (
    combined.includes('too_many') ||
    combined.includes('many attempts') ||
    combined.includes('محاولات') ||
    combined.includes('rate limit') ||
    combined.includes('rate_limit')
  ) {
    return m('too_many_attempts');
  }

  if (
    combined.includes('not approved') ||
    combined.includes('not_approved') ||
    combined.includes('لم تتم الموافقة') ||
    combined.includes('pending_review') ||
    combined.includes('pending review')
  ) {
    return m('not_approved_yet');
  }

  if (
    combined.includes('not found') ||
    combined.includes('not_found') ||
    combined.includes('غير موجود')
  ) {
    return m('request_not_found');
  }

  if (normalized.code === 'FORBIDDEN') {
    return m('forbidden');
  }

  if (normalized.code === 'SERVER_ERROR') {
    return m('server_unavailable');
  }

  const fieldErrors = normalized.fieldErrors;
  if (fieldErrors) {
    const allErrors = Object.values(fieldErrors)
      .flat()
      .map((e) => e.toLowerCase());
    for (const err of allErrors) {
      if (err.includes('phone') || err.includes('جوال') || err.includes('رقم')) {
        return m('invalid_phone');
      }
      if (err.includes('email') || err.includes('بريد')) {
        return m('invalid_email');
      }
      if (err.includes('password') || err.includes('كلمة المرور') || err.includes('pass')) {
        if (err.includes('match') || err.includes('غير متطابقة') || err.includes('mismatch')) {
          return m('password_mismatch');
        }
        if (
          err.includes('weak') ||
          err.includes('ضعيفة') ||
          err.includes('short') ||
          err.includes('قصيرة')
        ) {
          return m('weak_password');
        }
      }
      if (
        err.includes('file') ||
        err.includes('card') ||
        err.includes('صورة') ||
        err.includes('بطاقة')
      ) {
        if (err.includes('required') || err.includes('مطلوبة') || err.includes('required')) {
          return m('file_required');
        }
        return m('invalid_file');
      }
    }
  }

  if (
    (normalized.code === 'VALIDATION_ERROR' || normalized.code === 'UNKNOWN_ERROR') &&
    normalized.message &&
    normalized.message !== D1_GENERIC
  ) {
    return normalized.message;
  }

  return null;
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
