import { createApiError } from '../../../api/errors';
import {
  applyPageNav,
  clampPage,
  filterLectures,
  isRetryable,
  isTerminalStatus,
  isViewable,
  lectureErrorKind,
  MIN_FORCED_REFRESH_AGE_MS,
  needsNewSession,
  parseExpiry,
  parsePageInput,
  pollDelayMs,
  prefetchPages,
  SESSION_EXPIRY_SKEW_MS,
  SESSION_REQUEST_BUDGET,
  sessionState,
  shouldRetryWithNewSession,
  stepZoom,
  toggleZoom,
  uniqueSubjects,
  GENERAL_LECTURES_FILTER,
  isGeneralLecture,
  type ViewerSession,
} from '../logic';
import type { Lecture } from '../types';

const NOW = 1_000_000;

function session(overrides: Partial<ViewerSession> = {}): ViewerSession {
  return { token: 't', issuedAt: NOW - 10_000, expiresAt: NOW + 600_000, used: 0, ...overrides };
}

function lecture(overrides: Partial<Lecture>): Lecture {
  return {
    id: 1,
    subject: 10,
    subject_name: 'Anatomy',
    faculty: null,
    faculty_name: null,
    is_general: false,
    title: 'Intro',
    description: null,
    status: 'ready',
    page_count: 5,
    is_published: true,
    published_at: null,
    can_view: true,
    created_at: null,
    updated_at: null,
    ...overrides,
  };
}

describe('session state', () => {
  it('is missing without a session', () => {
    expect(sessionState(null, NOW)).toBe('missing');
    expect(needsNewSession(null, NOW)).toBe(true);
  });

  it('is valid while far from expiry and under budget', () => {
    expect(sessionState(session(), NOW)).toBe('valid');
    expect(needsNewSession(session(), NOW)).toBe(false);
  });

  it('expires early by the skew', () => {
    const edge = session({ expiresAt: NOW + SESSION_EXPIRY_SKEW_MS });
    expect(sessionState(edge, NOW)).toBe('expired');
    expect(sessionState(session({ expiresAt: NOW + SESSION_EXPIRY_SKEW_MS + 1 }), NOW)).toBe(
      'valid',
    );
  });

  it('is exhausted at the request budget', () => {
    expect(sessionState(session({ used: SESSION_REQUEST_BUDGET - 1 }), NOW)).toBe('valid');
    expect(sessionState(session({ used: SESSION_REQUEST_BUDGET }), NOW)).toBe('exhausted');
  });

  it('parses expiry safely', () => {
    expect(parseExpiry('2030-01-01T00:00:00Z')).toBe(Date.parse('2030-01-01T00:00:00Z'));
    expect(parseExpiry('nope')).toBe(0);
    expect(parseExpiry(undefined)).toBe(0);
  });
});

describe('shouldRetryWithNewSession', () => {
  const notFound = createApiError({ status: 404 });
  const server = createApiError({ status: 500 });

  it('retries a 404 on an old session', () => {
    const old = session({ issuedAt: NOW - MIN_FORCED_REFRESH_AGE_MS });
    expect(shouldRetryWithNewSession(notFound, 'page', old, NOW)).toBe(true);
    expect(shouldRetryWithNewSession(notFound, 'text', old, NOW)).toBe(true);
  });

  it('does not retry a 404 on a fresh session (a new one cannot help)', () => {
    const fresh = session({ issuedAt: NOW - 100 });
    expect(shouldRetryWithNewSession(notFound, 'page', fresh, NOW)).toBe(false);
  });

  it('never renews for thumbnails (a missing thumbnail is legitimate)', () => {
    expect(shouldRetryWithNewSession(notFound, 'thumbnail', session(), NOW)).toBe(false);
  });

  it('ignores other failures', () => {
    expect(shouldRetryWithNewSession(server, 'page', session(), NOW)).toBe(false);
    expect(shouldRetryWithNewSession(new Error('x'), 'page', session(), NOW)).toBe(false);
  });

  it('retries when there is no session at all', () => {
    expect(shouldRetryWithNewSession(notFound, 'page', null, NOW)).toBe(true);
  });
});

describe('page navigation', () => {
  it('clamps pages', () => {
    expect(clampPage(0, 10)).toBe(1);
    expect(clampPage(11, 10)).toBe(10);
    expect(clampPage(3.9, 10)).toBe(3);
    expect(clampPage(NaN, 10)).toBe(1);
    expect(clampPage(5, 0)).toBe(1);
  });

  it('applies nav actions', () => {
    expect(applyPageNav(1, 'prev', 5)).toBe(1);
    expect(applyPageNav(5, 'next', 5)).toBe(5);
    expect(applyPageNav(2, 'next', 5)).toBe(3);
    expect(applyPageNav(3, 'first', 5)).toBe(1);
    expect(applyPageNav(3, 'last', 5)).toBe(5);
  });

  it('parses the jump input including Arabic-Indic digits', () => {
    expect(parsePageInput('7', 10)).toBe(7);
    expect(parsePageInput(' ٧ ', 10)).toBe(7);
    expect(parsePageInput('۱۰', 10)).toBe(10);
    expect(parsePageInput('11', 10)).toBeNull();
    expect(parsePageInput('0', 10)).toBeNull();
    expect(parsePageInput('1.5', 10)).toBeNull();
    expect(parsePageInput('', 10)).toBeNull();
    expect(parsePageInput('abc', 10)).toBeNull();
  });

  it('prefetches the next page first and stays in range', () => {
    expect(prefetchPages(3, 10)).toEqual([4, 2]);
    expect(prefetchPages(1, 10)).toEqual([2]);
    expect(prefetchPages(10, 10)).toEqual([9]);
    expect(prefetchPages(1, 1)).toEqual([]);
  });

  it('steps and toggles zoom', () => {
    expect(stepZoom(1, 1)).toBe(1.5);
    expect(stepZoom(3, 1)).toBe(3);
    expect(stepZoom(2, -1)).toBe(1.5);
    expect(stepZoom(1, -1)).toBe(1);
    expect(toggleZoom(1)).toBe(2);
    expect(toggleZoom(2)).toBe(1);
  });
});

describe('processing status', () => {
  it('knows terminal statuses', () => {
    expect(isTerminalStatus('ready')).toBe(true);
    expect(isTerminalStatus('failed')).toBe(true);
    expect(isTerminalStatus('quarantined')).toBe(true);
    expect(isTerminalStatus('rendering')).toBe(false);
    expect(isTerminalStatus(undefined)).toBe(false);
  });

  it('backs off exponentially up to 30 seconds', () => {
    expect(pollDelayMs(0)).toBe(3000);
    expect(pollDelayMs(1)).toBe(4500);
    expect(pollDelayMs(2)).toBe(6750);
    expect(pollDelayMs(50)).toBe(30_000);
    expect(pollDelayMs(-3)).toBe(3000);
  });

  it('decides viewability', () => {
    expect(isViewable(lecture({}))).toBe(true);
    expect(isViewable(lecture({ status: 'rendering' }))).toBe(false);
    expect(isViewable(lecture({ can_view: false }))).toBe(false);
    expect(isViewable(lecture({ page_count: 0 }))).toBe(false);
  });
});

describe('error kinds', () => {
  it('maps API errors to user categories', () => {
    expect(lectureErrorKind(createApiError({ code: 'NETWORK_ERROR' }))).toBe('network');
    expect(lectureErrorKind(createApiError({ code: 'TIMEOUT' }))).toBe('timeout');
    expect(lectureErrorKind(createApiError({ status: 429 }))).toBe('rateLimited');
    expect(lectureErrorKind(createApiError({ status: 404 }))).toBe('notFound');
    expect(lectureErrorKind(createApiError({ status: 403 }))).toBe('forbidden');
    expect(lectureErrorKind(createApiError({ status: 502 }))).toBe('unavailable');
    expect(lectureErrorKind(createApiError({ status: 410 }))).toBe('notFound');
    expect(lectureErrorKind(createApiError({ status: 503, errorCode: 'FEATURE_DISABLED' }))).toBe(
      'featureDisabled',
    );
    expect(lectureErrorKind(new Error('boom'))).toBe('unknown');
  });

  it('flags only transient failures as retryable', () => {
    expect(isRetryable(createApiError({ code: 'NETWORK_ERROR' }))).toBe(true);
    expect(isRetryable(createApiError({ status: 500 }))).toBe(true);
    expect(isRetryable(createApiError({ status: 403 }))).toBe(false);
    expect(isRetryable(createApiError({ status: 404 }))).toBe(false);
  });
});

describe('lecture list helpers', () => {
  const lectures = [
    lecture({ id: 1, subject: 10, subject_name: 'Anatomy', title: 'Heart' }),
    lecture({ id: 2, subject: 11, subject_name: 'Biology', title: 'Cell' }),
    lecture({ id: 3, subject: 10, subject_name: 'Anatomy', title: null }),
    lecture({
      id: 4,
      subject: null,
      subject_name: null,
      is_general: true,
      title: 'Study tips',
    }),
  ];

  it('filters by subject and search', () => {
    expect(filterLectures(lectures, { subject: 10 }).map((item) => item.id)).toEqual([1, 3]);
    expect(filterLectures(lectures, { subject: '11' }).map((item) => item.id)).toEqual([2]);
    expect(filterLectures(lectures, { search: ' heart ' }).map((item) => item.id)).toEqual([1]);
    expect(filterLectures(lectures, { search: 'bio' }).map((item) => item.id)).toEqual([2]);
    expect(filterLectures(lectures, {}).length).toBe(4);
    expect(filterLectures(lectures, { subject: null, search: '' }).length).toBe(4);
  });

  it('selects general lectures with the pseudo filter and keeps them out of subjects', () => {
    expect(
      filterLectures(lectures, { subject: GENERAL_LECTURES_FILTER }).map((item) => item.id),
    ).toEqual([4]);
    expect(filterLectures(lectures, { subject: 10 }).map((item) => item.id)).toEqual([1, 3]);
    expect(filterLectures(lectures, { search: 'tips' }).map((item) => item.id)).toEqual([4]);
    expect(isGeneralLecture(lectures[3])).toBe(true);
    expect(isGeneralLecture(lectures[0])).toBe(false);
  });

  it('lists unique subjects sorted by name', () => {
    expect(uniqueSubjects(lectures)).toEqual([
      { id: '10', name: 'Anatomy' },
      { id: '11', name: 'Biology' },
    ]);
  });
});
