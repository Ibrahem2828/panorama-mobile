import { apiClient } from '../client';
import { endpoints } from '../endpoints';

export type AccountDeletionStatus = 'pending' | 'cancelled' | 'completed' | string;

export type AccountDeletionRecord = {
  status: AccountDeletionStatus;
  requested_at: string | null;
  scheduled_for: string | null;
  cancelled_at: string | null;
  completed_at: string | null;
  reason: string;
};

function newIdempotencyKey(): string {
  const random = Math.random().toString(36).slice(2, 12);
  return `acct-del-${Date.now().toString(36)}-${random}`;
}

export function getAccountDeletionStatus(authToken: string) {
  return apiClient.get<AccountDeletionRecord | null>(endpoints.account.deletionStatus, {
    authToken,
  });
}

export function requestAccountDeletion(reason: string, authToken: string) {
  return apiClient.post<AccountDeletionRecord, { reason: string }>(
    endpoints.account.deletionRequest,
    { reason },
    { authToken, headers: { 'Idempotency-Key': newIdempotencyKey() } },
  );
}

export function cancelAccountDeletion(authToken: string) {
  return apiClient.post<AccountDeletionRecord, Record<string, never>>(
    endpoints.account.deletionCancel,
    {},
    { authToken },
  );
}
