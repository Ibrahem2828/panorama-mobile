import { normalizeApiError } from '../../api/errors';
import type { Lecture, LectureStatus, PageKind } from './types';
import { LECTURE_STATUSES } from './types';

// ---------------------------------------------------------------------------------------------------------------------
// Viewer session (backend: X-Viewer-Session UUID, TTL 900 s, 1200 page requests by default, both configurable server side)
// ---------------------------------------------------------------------------------------------------------------------

/** Client-side budget kept below the backend default cap (1200) so a new session is issued before a request fails. */
export const SESSION_REQUEST_BUDGET = 1000;
/** A session is renewed this long before its `expires_at` (clock skew + request latency). */
export const SESSION_EXPIRY_SKEW_MS = 30_000;
/** A 404 only triggers a forced renewal when the session is at least this old (a fresh session cannot be the cause). */
export const MIN_FORCED_REFRESH_AGE_MS = 5_000;

export type ViewerSession = {
  token: string;
  /** Epoch ms. */
  expiresAt: number;
  issuedAt: number;
  /** Page-class requests (page, thumbnail, text) sent with this session; the backend counts every one of them. */
  used: number;
};

export type SessionState = 'missing' | 'expired' | 'exhausted' | 'valid';

export function parseExpiry(value: unknown): number {
  if (typeof value !== 'string') return 0;
  const time = Date.parse(value);
  return Number.isFinite(time) ? time : 0;
}

type SessionOptions = { budget?: number; skewMs?: number };

export function sessionState(
  session: ViewerSession | null,
  now: number,
  options: SessionOptions = {},
): SessionState {
  if (!session) return 'missing';
  const budget = options.budget ?? SESSION_REQUEST_BUDGET;
  const skew = options.skewMs ?? SESSION_EXPIRY_SKEW_MS;
  if (session.expiresAt - skew <= now) return 'expired';
  if (session.used >= budget) return 'exhausted';
  return 'valid';
}

/** True when a new session must be issued before sending the next page-class request. */
export function needsNewSession(
  session: ViewerSession | null,
  now: number,
  options?: SessionOptions,
): boolean {
  return sessionState(session, now, options) !== 'valid';
}

/**
 * Whether a failed page-class request should be retried (once) with a new session. The backend answers 404 for an
 * unknown, expired, revoked or exhausted session (it cannot be told apart from a missing page), so a 404 on a page
 * request with an old-enough session is retried once. Thumbnails never trigger renewal: a page without thumbnail is a
 * legitimate 404.
 */
export function shouldRetryWithNewSession(
  error: unknown,
  kind: PageKind | 'text',
  session: ViewerSession | null,
  now: number,
): boolean {
  if (normalizeApiError(error).status !== 404) return false;
  if (kind === 'thumbnail') return false;
  if (!session) return true;
  return now - session.issuedAt >= MIN_FORCED_REFRESH_AGE_MS;
}

// ---------------------------------------------------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------------------------------------------------

export type PageNavAction = 'next' | 'prev' | 'first' | 'last';

export function clampPage(page: number, total: number): number {
  if (!Number.isFinite(page) || total < 1) return 1;
  return Math.min(Math.max(Math.trunc(page), 1), total);
}

export function applyPageNav(current: number, action: PageNavAction, total: number): number {
  switch (action) {
    case 'next':
      return clampPage(current + 1, total);
    case 'prev':
      return clampPage(current - 1, total);
    case 'first':
      return 1;
    case 'last':
      return clampPage(total, total);
  }
}

const EASTERN_ARABIC = '٠١٢٣٤٥٦٧٨٩';
const PERSIAN = '۰۱۲۳۴۵۶۷۸۹';

/** Parses the "go to page" input (accepts Arabic-Indic digits). Returns null when it is not a page in `1..total`. */
export function parsePageInput(raw: string, total: number): number | null {
  const normalized = raw
    .trim()
    .replace(/[٠-٩]/gu, (digit) => String(EASTERN_ARABIC.indexOf(digit)))
    .replace(/[۰-۹]/gu, (digit) => String(PERSIAN.indexOf(digit)));
  if (!/^\d{1,6}$/u.test(normalized)) return null;
  const value = Number(normalized);
  return value >= 1 && value <= total ? value : null;
}

/** Pages worth prefetching around `page` (next first: reading is mostly forward). */
export function prefetchPages(page: number, total: number): number[] {
  return [page + 1, page - 1].filter((candidate) => candidate >= 1 && candidate <= total);
}

export const ZOOM_STEPS = [1, 1.5, 2, 3] as const;
export const ZOOM_FIT = 1;

export function stepZoom(current: number, direction: 1 | -1): number {
  const first = ZOOM_STEPS[0];
  const last = ZOOM_STEPS[ZOOM_STEPS.length - 1] ?? first;
  if (direction === 1) return ZOOM_STEPS.find((step) => step > current + 1e-6) ?? last;
  return [...ZOOM_STEPS].reverse().find((step) => step < current - 1e-6) ?? first;
}

/** Double tap toggles between fit and 2x. */
export function toggleZoom(current: number): number {
  return current > ZOOM_FIT + 1e-6 ? ZOOM_FIT : 2;
}

// ---------------------------------------------------------------------------------------------------------------------
// Processing status polling
// ---------------------------------------------------------------------------------------------------------------------

export const TERMINAL_STATUSES = ['ready', 'failed', 'quarantined'] as const;

export function isTerminalStatus(status: string | null | undefined): boolean {
  return (TERMINAL_STATUSES as readonly string[]).includes(status ?? '');
}

export function isKnownStatus(status: string): status is LectureStatus {
  return (LECTURE_STATUSES as readonly string[]).includes(status);
}

/** Exponential backoff for status polling: 3 s, 4.5 s, 6.75 s ... capped at 30 s. */
export function pollDelayMs(attempt: number): number {
  const exponent = Math.max(0, Math.min(attempt, 12));
  return Math.min(30_000, Math.round(3_000 * 1.5 ** exponent));
}

/** A lecture can be opened in the viewer only when it is ready, visible to the student and has pages. */
export function isViewable(lecture: Pick<Lecture, 'status' | 'can_view' | 'page_count'>): boolean {
  return lecture.status === 'ready' && lecture.can_view !== false && lecture.page_count > 0;
}

// ---------------------------------------------------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------------------------------------------------

export type LectureErrorKind =
  | 'network'
  | 'timeout'
  | 'rateLimited'
  | 'featureDisabled'
  | 'unavailable'
  | 'notFound'
  | 'forbidden'
  | 'unknown';

/** Maps an API failure to a user-facing category. */
export function lectureErrorKind(error: unknown): LectureErrorKind {
  const normalized = normalizeApiError(error);
  if (normalized.errorCode === 'FEATURE_DISABLED') return 'featureDisabled';
  switch (normalized.code) {
    case 'NETWORK_ERROR':
      return 'network';
    case 'TIMEOUT':
      return 'timeout';
    case 'RATE_LIMITED':
      return 'rateLimited';
    case 'NOT_FOUND':
      return 'notFound';
    case 'FORBIDDEN':
      return 'forbidden';
    case 'SERVER_ERROR':
    case 'MAINTENANCE_MODE':
      return 'unavailable';
    default:
      return normalized.status === 410 ? 'notFound' : 'unknown';
  }
}

/** True for failures worth an automatic or manual retry (as opposed to a definitive denial). */
export function isRetryable(error: unknown): boolean {
  const kind = lectureErrorKind(error);
  return (
    kind === 'network' || kind === 'timeout' || kind === 'rateLimited' || kind === 'unavailable'
  );
}

// ---------------------------------------------------------------------------------------------------------------------
// Lecture list helpers
// ---------------------------------------------------------------------------------------------------------------------

export function lectureTitle(lecture: Pick<Lecture, 'title'>, fallback: string): string {
  return lecture.title?.trim() || fallback;
}

/** Pseudo subject filter value that selects the general (subject-less) lectures. */
export const GENERAL_LECTURES_FILTER = '__general';

export function isGeneralLecture(lecture: Pick<Lecture, 'subject' | 'is_general'>): boolean {
  return lecture.subject === null || lecture.subject === undefined || lecture.is_general === true;
}

export type LectureFilters = {
  search?: string;
  subject?: string | number | null;
};

/** The list endpoint only paginates, so search and subject filters run client-side on the full accessible list. */
export function filterLectures(lectures: readonly Lecture[], filters: LectureFilters): Lecture[] {
  const needle = filters.search?.trim().toLocaleLowerCase() ?? '';
  const subject =
    filters.subject === undefined || filters.subject === null || filters.subject === ''
      ? null
      : String(filters.subject);
  return lectures.filter((lecture) => {
    if (subject === GENERAL_LECTURES_FILTER) {
      if (!isGeneralLecture(lecture)) return false;
    } else if (subject !== null) {
      if (lecture.subject === null || String(lecture.subject) !== subject) return false;
    }
    if (!needle) return true;
    return `${lecture.title ?? ''} ${lecture.subject_name ?? ''} ${lecture.faculty_name ?? ''}`
      .toLocaleLowerCase()
      .includes(needle);
  });
}

export function uniqueSubjects(lectures: readonly Lecture[]): { id: string; name: string }[] {
  const seen = new Map<string, string>();
  for (const lecture of lectures) {
    if (lecture.subject === null || lecture.subject === undefined) continue;
    const id = String(lecture.subject);
    if (!seen.has(id)) seen.set(id, lecture.subject_name?.trim() || id);
  }
  return [...seen.entries()]
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
