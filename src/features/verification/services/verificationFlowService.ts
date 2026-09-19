import {
  normalizeApiError,
  verificationService,
  type EmptyResponse,
  type VerificationRecord as ApiVerificationRecord,
} from '../../../api';
import type { VerificationCardImage, VerificationRecord, VerificationStatus } from '../types';
import type { TranslationCatalog } from '../../../i18n';

type VerificationCatalog = TranslationCatalog['verificationFlow'];

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

export function toSafeVerificationErrorMessage(error: unknown, t: VerificationCatalog): string {
  const normalizedError = normalizeApiError(error);

  if (normalizedError.code === 'NETWORK_ERROR' || normalizedError.code === 'TIMEOUT') {
    return t.errors.network;
  }

  if (normalizedError.code === 'UNAUTHORIZED') {
    return t.errors.unauthorized;
  }

  if (normalizedError.code === 'VALIDATION_ERROR') {
    return t.errors.validation;
  }

  return normalizedError.message || t.errors.generic;
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
