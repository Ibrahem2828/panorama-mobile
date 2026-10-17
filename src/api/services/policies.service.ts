import { apiClient } from '../client';
import { endpoints } from '../endpoints';

export type PolicyAcceptanceRequest = {
  terms_version?: string;
  privacy_version?: string;
  locale: 'ar' | 'en';
};

/** What this signed-in user still has to accept (the server is the only source of truth). */
export function getPolicyStatus(authToken: string): Promise<unknown> {
  return apiClient.get<unknown>(endpoints.policies.status, { authToken });
}

export function acceptPolicies(
  body: PolicyAcceptanceRequest,
  authToken: string,
  idempotencyKey?: string,
): Promise<unknown> {
  return apiClient.post<unknown, PolicyAcceptanceRequest>(endpoints.policies.accept, body, {
    authToken,
    idempotencyKey,
  });
}
