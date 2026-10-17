import { apiClient } from '../client';
import { endpoints } from '../endpoints';

export type AccountDeletionStatus = 'requested' | 'cancelled' | 'completed' | string;

export type AccountDeletionRecord = {
  status: AccountDeletionStatus;
  requested_at: string | null;
  scheduled_for: string | null;
  cancelled_at: string | null;
  completed_at: string | null;
  reason: string;
};

export function getAccountDeletionStatus(authToken: string) {
  return apiClient.get<AccountDeletionRecord | null>(endpoints.account.deletionStatus, {
    authToken,
  });
}

export function requestAccountDeletion(reason: string, authToken: string, idempotencyKey?: string) {
  return apiClient.post<AccountDeletionRecord, { reason: string }>(
    endpoints.account.deletionRequest,
    { reason },
    { authToken, idempotencyKey },
  );
}

export function cancelAccountDeletion(authToken: string) {
  return apiClient.post<AccountDeletionRecord, Record<string, never>>(
    endpoints.account.deletionCancel,
    {},
    { authToken },
  );
}
