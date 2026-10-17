import { normalizeApiError, accountService, runIdempotentAction } from '../../../api';
import type { AccountDeletionRecord } from '../../../api/services/account.service';

export const MAX_DELETION_REASON_LENGTH = 500;

/** The backend answers `{}` (or null) when deletion was never requested. */
export function normalizeDeletionRecord(value: unknown): AccountDeletionRecord | null {
  if (!value || typeof value !== 'object') return null;

  const record = value as Partial<AccountDeletionRecord>;

  return typeof record.status === 'string' ? (record as AccountDeletionRecord) : null;
}

/** Backend status `requested`: the account is scheduled for deletion and can still be restored. */
export function isDeletionRequested(record: AccountDeletionRecord | null): boolean {
  return record?.status === 'requested';
}

/** The feature can be switched off for an account (403/404/501/503): the whole section hides. */
export function isDeletionUnavailable(error: unknown): boolean {
  const { status } = normalizeApiError(error);

  return status === 403 || status === 404 || status === 501 || status === 503;
}

export async function loadDeletionStatus(authToken: string): Promise<AccountDeletionRecord | null> {
  return normalizeDeletionRecord(await accountService.getAccountDeletionStatus(authToken));
}

export async function requestDeletion(
  reason: string,
  authToken: string,
): Promise<AccountDeletionRecord | null> {
  const trimmed = reason.trim().slice(0, MAX_DELETION_REASON_LENGTH);

  // One key per request: a retry after a dropped connection re-uses it and cannot file twice.
  return normalizeDeletionRecord(
    await runIdempotentAction('account:deletion-request', trimmed, (idempotencyKey) =>
      accountService.requestAccountDeletion(trimmed, authToken, idempotencyKey),
    ),
  );
}

export async function cancelDeletion(authToken: string): Promise<AccountDeletionRecord | null> {
  return normalizeDeletionRecord(await accountService.cancelAccountDeletion(authToken));
}
