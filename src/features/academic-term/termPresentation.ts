import type { TermOption } from './types';

type WithTerm = { in_current_term?: boolean };
type LooseId = string | number | null | undefined;

export function sameId(left: LooseId, right: LooseId): boolean {
  return left != null && right != null && String(left) === String(right);
}

/** Current-term subjects first, the rest after; the order inside each group is the server's. */
export function groupSubjectsByTerm<T extends WithTerm>(
  items: readonly T[],
): { current: T[]; other: T[] } {
  const current: T[] = [];
  const other: T[] = [];

  for (const item of items) {
    (item.in_current_term === true ? current : other).push(item);
  }

  return { current, other };
}

export function sortSubjectsCurrentTermFirst<T extends WithTerm>(items: readonly T[]): T[] {
  const { current, other } = groupSubjectsByTerm(items);

  return [...current, ...other];
}

/** The current semester first, then the other one, then anything else the server lists. */
export function orderSemesters<T extends { id: string | number }>(
  semesters: readonly T[],
  currentSemesterId: LooseId,
): T[] {
  const current = semesters.filter((item) => sameId(item.id, currentSemesterId));
  const rest = semesters.filter((item) => !sameId(item.id, currentSemesterId));

  return [...current, ...rest];
}

/**
 * Pre-selection for "yes, I moved up": the year after the student's current one (the last year stays where it is, a
 * student without a year starts at the first) and the semester the university is in now.
 */
export function getDefaultNextLevel(input: {
  years: readonly TermOption[];
  semesters: readonly TermOption[];
  currentYearId: LooseId;
  termSemesterId: LooseId;
}): { academicYearId: string | number | null; semesterId: string | number | null } {
  const { years, semesters, currentYearId, termSemesterId } = input;
  const index = years.findIndex((year) => sameId(year.id, currentYearId));
  const nextYear =
    index < 0 ? years[0] : (years[Math.min(index + 1, years.length - 1)] ?? years[index]);
  const semester = semesters.find((item) => sameId(item.id, termSemesterId)) ?? semesters[0];

  return { academicYearId: nextYear?.id ?? null, semesterId: semester?.id ?? null };
}

/**
 * The confirmation sheet shows when the server asks for it, the student has not answered it in this session, and the
 * device is online: offline use is never gated (the question is asked again when the connection is back). A sheet that
 * is already open stays open if the connection drops, so a retry is possible.
 */
export function shouldShowTermSheet(input: {
  isStudent: boolean;
  needsConfirmation: boolean | undefined;
  answered: boolean;
  postponed: boolean;
  isOnline: boolean;
  sheetOpenWhenOffline: boolean;
}): boolean {
  if (!input.isStudent || input.needsConfirmation !== true || input.answered || input.postponed) {
    return false;
  }

  return input.isOnline || input.sheetOpenWhenOffline;
}

/**
 * Applies the student's answer to the cached profile right away, so the sheet closes and the rest of the app sees the
 * new level without waiting for a reload. The server stays the source of truth on the next refresh.
 */
export function applyTermAnswerToProfile<
  P extends {
    needs_term_confirmation?: boolean;
    academic_year?: unknown;
    academicYear?: unknown;
    semester?: unknown;
  },
>(
  profile: P | null,
  answer: { promoted: boolean; year: TermOption | null; semester: TermOption | null },
): P | null {
  if (!profile) {
    return profile;
  }

  const next = { ...profile, needs_term_confirmation: false };

  if (answer.promoted && answer.year && answer.semester) {
    next.academic_year = { id: answer.year.id, name: answer.year.name };
    next.academicYear = next.academic_year;
    next.semester = { id: answer.semester.id, name: answer.semester.name };
  }

  return next;
}
