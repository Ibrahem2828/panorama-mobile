import { apiClient } from '../client';
import { endpoints } from '../endpoints';
import type { EmptyResponse, VerificationRecord } from '../types';

export function getMyVerification(authToken?: string | null) {
  return apiClient.get<VerificationRecord>(endpoints.verification.me, {
    authToken,
  });
}

export function submitVerification(formData: FormData, authToken?: string | null) {
  return apiClient.post<VerificationRecord, FormData>(endpoints.verification.submit, formData, {
    authToken,
  });
}

export function resubmitVerification(formData: FormData, authToken?: string | null) {
  return apiClient.post<VerificationRecord | EmptyResponse, FormData>(
    endpoints.verification.resubmit,
    formData,
    { authToken },
  );
}
