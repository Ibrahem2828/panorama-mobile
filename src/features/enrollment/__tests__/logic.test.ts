import type { EnrollmentRecord } from '../../../api/services/enrollment.service';
import {
  ENROLLMENT_POLL_MS,
  enrollmentPrimaryAction,
  isEnrollmentPush,
  isTerminalStatus,
  pickLatestEnrollment,
  shouldPollEnrollment,
  sortEnrollmentsNewestFirst,
} from '../logic';

function record(
  id: number,
  status: EnrollmentRecord['status'],
  createdAt = `2026-11-0${id}T10:00:00Z`,
): EnrollmentRecord {
  return { id, status, review_note: '', items: [], created_at: createdAt, reviewed_at: null };
}

describe('enrollment state machine', () => {
  it('treats every status except pending as terminal', () => {
    expect(isTerminalStatus('pending')).toBe(false);
    for (const status of ['approved', 'partially_approved', 'rejected', 'cancelled'] as const) {
      expect(isTerminalStatus(status)).toBe(true);
    }
  });

  it('sorts newest first regardless of server order, falling back to id', () => {
    const sorted = sortEnrollmentsNewestFirst([
      record(1, 'rejected'),
      record(3, 'approved'),
      record(2, 'cancelled'),
    ]);

    expect(sorted.map((item) => item.id)).toEqual([3, 2, 1]);
    expect(
      sortEnrollmentsNewestFirst([record(1, 'approved', 'x'), record(2, 'approved', 'y')]).map(
        (item) => item.id,
      ),
    ).toEqual([2, 1]);
  });

  it('picks a pending request over a newer terminal one and handles empty input', () => {
    expect(pickLatestEnrollment(null)).toBeNull();
    expect(pickLatestEnrollment([])).toBeNull();
    expect(pickLatestEnrollment([record(1, 'rejected'), record(2, 'cancelled')])?.id).toBe(2);
    expect(pickLatestEnrollment([record(1, 'pending'), record(2, 'cancelled')])?.id).toBe(1);
  });

  it('offers cancel while pending and a new request in every terminal state', () => {
    expect(enrollmentPrimaryAction(record(1, 'pending'), false)).toBe('cancel');
    for (const status of ['approved', 'partially_approved', 'rejected', 'cancelled'] as const) {
      expect(enrollmentPrimaryAction(record(1, status), false)).toBe('new_request');
    }
    expect(enrollmentPrimaryAction(null, false)).toBe('submit');
    expect(enrollmentPrimaryAction(record(1, 'approved'), true)).toBe('submit');
  });

  it('moves the primary action when a pending request is decided on the server', () => {
    const before = pickLatestEnrollment([record(1, 'pending')]);
    const after = pickLatestEnrollment([record(1, 'approved')]);

    expect(enrollmentPrimaryAction(before, false)).toBe('cancel');
    expect(enrollmentPrimaryAction(after, false)).toBe('new_request');
  });

  it('polls only while pending, focused and in the foreground', () => {
    const base = { latest: record(1, 'pending'), focused: true, appActive: true };

    expect(shouldPollEnrollment(base)).toBe(true);
    expect(shouldPollEnrollment({ ...base, focused: false })).toBe(false);
    expect(shouldPollEnrollment({ ...base, appActive: false })).toBe(false);
    expect(shouldPollEnrollment({ ...base, starting: true })).toBe(false);
    expect(shouldPollEnrollment({ ...base, latest: record(1, 'approved') })).toBe(false);
    expect(shouldPollEnrollment({ ...base, latest: null })).toBe(false);
    expect(ENROLLMENT_POLL_MS).toBeGreaterThanOrEqual(20_000);
    expect(ENROLLMENT_POLL_MS).toBeLessThanOrEqual(30_000);
  });

  it('recognises enrollment pushes by category, kind or type', () => {
    expect(isEnrollmentPush({ kind: 'enrollment' })).toBe(true);
    expect(isEnrollmentPush({ type: 'Enrollment_approved' })).toBe(true);
    expect(isEnrollmentPush({ category: 'enrollment' })).toBe(true);
    expect(isEnrollmentPush({ kind: 'chat' })).toBe(false);
    expect(isEnrollmentPush(null)).toBe(false);
  });
});
