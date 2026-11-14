import type { EnrollmentRecord, EnrollmentStatus } from '../../api/services/enrollment.service';

/** How often a pending request is re-read while the screen is in front of the student. */
export const ENROLLMENT_POLL_MS = 25_000;

/** A decision has been made (or the student withdrew): the request can no longer change. */
export function isTerminalStatus(status: EnrollmentStatus): boolean {
  return status !== 'pending';
}

/** Newest request first, whatever order the server returned them in. */
export function sortEnrollmentsNewestFirst(
  records: readonly EnrollmentRecord[],
): EnrollmentRecord[] {
  return [...records].sort((a, b) => {
    const byDate = Date.parse(b.created_at) - Date.parse(a.created_at);

    if (Number.isFinite(byDate) && byDate !== 0) return byDate;

    return b.id - a.id;
  });
}

/** The request the screen is about. A pending one always wins: it is the only one that can still change. */
export function pickLatestEnrollment(
  records: readonly EnrollmentRecord[] | null,
): EnrollmentRecord | null {
  if (!records || records.length === 0) return null;

  const sorted = sortEnrollmentsNewestFirst(records);

  return sorted.find((record) => record.status === 'pending') ?? sorted[0] ?? null;
}

export type EnrollmentPrimaryAction = 'cancel' | 'new_request' | 'submit';

/**
 * What the screen offers first: cancel while a request waits, a new request after every outcome (approved, partially
 * approved, rejected, cancelled), the submission wizard when there is nothing yet or the student chose to start again.
 */
export function enrollmentPrimaryAction(
  latest: EnrollmentRecord | null,
  starting: boolean,
): EnrollmentPrimaryAction {
  if (starting || !latest) return 'submit';

  return latest.status === 'pending' ? 'cancel' : 'new_request';
}

/** Polling runs only while it can matter: a pending request, the screen focused and the app in the foreground. */
export function shouldPollEnrollment(input: {
  latest: EnrollmentRecord | null;
  focused: boolean;
  appActive: boolean;
  starting?: boolean;
}): boolean {
  return (
    input.focused &&
    input.appActive &&
    !input.starting &&
    input.latest !== null &&
    input.latest.status === 'pending'
  );
}

/** True when a push (its `data` payload) is about the student's enrollment request. */
export function isEnrollmentPush(data: Record<string, unknown> | null | undefined): boolean {
  if (!data) return false;

  return [data.category, data.kind, data.type].some(
    (value) => typeof value === 'string' && value.toLowerCase().startsWith('enrollment'),
  );
}
