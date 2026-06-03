import {
  normalizeApiError,
  verificationService,
  type EmptyResponse,
  type VerificationRecord as ApiVerificationRecord,
} from '../../../api';
import type { VerificationCardImage, VerificationRecord, VerificationStatus } from '../types';

const NETWORK_MESSAGE = 'تعذر الاتصال بالخادم أثناء التحقق من حالة التوثيق. حاول مرة أخرى.';
const UNAUTHORIZED_MESSAGE = 'انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى.';
const VALIDATION_MESSAGE = 'يرجى اختيار صورة واضحة لبطاقة الطالب.';
const GENERIC_MESSAGE = 'تعذر تنفيذ طلب التوثيق. حاول مرة أخرى.';

type ReactNativeFormDataFile = {
  uri: string;
  name: string;
  type: string;
};

type ReactNativeFormData = FormData & {
  append(name: string, value: string | Blob | ReactNativeFormDataFile): void;
};

function isNotFound(error: unknown): boolean {
  return normalizeApiError(error).code === 'NOT_FOUND';
}

function isApiVerificationRecord(
  response: ApiVerificationRecord | EmptyResponse,
): response is ApiVerificationRecord {
  return typeof (response as { status?: unknown }).status === 'string';
}

export function toSafeVerificationErrorMessage(error: unknown): string {
  const normalizedError = normalizeApiError(error);

  if (normalizedError.code === 'NETWORK_ERROR' || normalizedError.code === 'TIMEOUT') {
    return NETWORK_MESSAGE;
  }

  if (normalizedError.code === 'UNAUTHORIZED') {
    return UNAUTHORIZED_MESSAGE;
  }

  if (normalizedError.code === 'VALIDATION_ERROR') {
    return VALIDATION_MESSAGE;
  }

  return normalizedError.message || GENERIC_MESSAGE;
}

export async function getMyVerification(authToken?: string | null) {
  try {
    return await verificationService.getMyVerification(authToken);
  } catch (error) {
    if (isNotFound(error)) {
      return null;
    }

    throw error;
  }
}

export function createVerificationFormData(image: VerificationCardImage): FormData {
  const formData = new FormData() as ReactNativeFormData;

  formData.append('card_image', {
    uri: image.uri,
    name: image.name,
    type: image.type,
  });

  return formData;
}

export function submitStudentVerification(image: VerificationCardImage, authToken?: string | null) {
  const formData = createVerificationFormData(image);

  return verificationService.submitVerification(formData, authToken);
}

export async function resubmitStudentVerification(
  image: VerificationCardImage,
  authToken?: string | null,
) {
  const formData = createVerificationFormData(image);
  const response = await verificationService.resubmitVerification(formData, authToken);

  if (isApiVerificationRecord(response)) {
    return response;
  }

  return getMyVerification(authToken);
}

export function getVerificationStatus(verification: VerificationRecord | null): VerificationStatus {
  return verification?.status ?? 'none';
}

export function getVerificationRejectionReason(
  verification: VerificationRecord | null,
): string | null {
  return verification?.rejection_reason ?? verification?.rejectionReason ?? null;
}

export function isVerificationApproved(verification: VerificationRecord | null): boolean {
  return getVerificationStatus(verification) === 'approved';
}

export function canResubmitVerification(verification: VerificationRecord | null): boolean {
  const status = getVerificationStatus(verification);

  return status === 'rejected' || status === 'needs_update';
}
