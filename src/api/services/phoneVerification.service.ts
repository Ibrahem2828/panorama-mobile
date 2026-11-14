import { apiClient } from '../client';
import { endpoints } from '../endpoints';
import type {
  ConfirmPhoneVerificationRequest,
  CreatePhoneVerificationRequest,
  CurrentPhoneVerification,
  PhoneVerificationRequest,
} from '../types';

export function createPhoneVerification(
  request: CreatePhoneVerificationRequest,
  authToken?: string | null,
) {
  return apiClient.post<PhoneVerificationRequest, CreatePhoneVerificationRequest>(
    endpoints.phoneVerification.create,
    request,
    { authToken },
  );
}

/** Always live: the status changes when staff send the code, so an offline copy would mislead. */
export function getCurrentPhoneVerification(authToken?: string | null) {
  return apiClient.get<CurrentPhoneVerification>(endpoints.phoneVerification.current, {
    authToken,
    noCache: true,
  });
}

export function confirmPhoneVerification(code: string, authToken?: string | null) {
  return apiClient.post<PhoneVerificationRequest, ConfirmPhoneVerificationRequest>(
    endpoints.phoneVerification.confirm,
    { code },
    { authToken },
  );
}

export function cancelPhoneVerification(authToken?: string | null) {
  return apiClient.post<PhoneVerificationRequest>(endpoints.phoneVerification.cancel, undefined, {
    authToken,
  });
}
