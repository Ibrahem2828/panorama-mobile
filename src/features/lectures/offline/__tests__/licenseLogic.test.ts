import {
  anchorGuard,
  CLOCK_ROLLBACK_TOLERANCE_MS,
  checkStorage,
  classifyOfflineError,
  clampBudget,
  decideResume,
  DEFAULT_BUDGET_BYTES,
  deriveItemState,
  EMPTY_GUARD,
  evaluateAccess,
  MAX_BUDGET_BYTES,
  MIN_BUDGET_BYTES,
  MIN_FREE_DISK_BYTES,
  observeClock,
  OFFLINE_RENEW_BEFORE_MS,
  parseContentRange,
  parseServerLicense,
  parseSyncResponse,
  planSync,
  resumeHeaders,
  usedBytes,
  type ClockGuard,
  type OfflineEntry,
} from '../licenseLogic';

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.parse('2026-11-14T10:00:00Z');

function entry(over: Partial<OfflineEntry> = {}): OfflineEntry {
  return {
    lectureId: 1,
    title: 'Lecture',
    subjectName: 'Subject',
    pageCount: 10,
    licenseId: 'lic-1',
    keyId: '12345678-1234-5678-1234-567812345678',
    contentKey: 'AAAA',
    packageVersion: 1,
    issuedAt: new Date(NOW).toISOString(),
    expiresAt: new Date(NOW + 14 * DAY).toISOString(),
    fileSize: 1000,
    plaintextSize: 900,
    chunkSize: 65536,
    sha256: 'ab',
    fileName: 'x',
    downloadedBytes: 1000,
    status: 'complete',
    etag: '"ab"',
    completedAt: NOW,
    ...over,
  };
}

const guardAt = (maxSeenMs: number): ClockGuard => ({ ...EMPTY_GUARD, maxSeenMs });

const licenseJson = {
  license_id: 'lic-1',
  lecture_id: 7,
  content_key: 'a2V5',
  key_id: '12345678-1234-5678-1234-567812345678',
  package_version: 2,
  issued_at: '2026-11-14T10:00:00Z',
  expires_at: '2026-11-28T10:00:00Z',
  state: 'active',
  file_size: 304,
  sha256_of_ciphertext: 'ABCDEF',
  algorithm: 'AES-256-GCM-chunked',
  format_version: 1,
  header_size: 40,
  chunk_size: 64,
  tag_size: 16,
  plaintext_size: 200,
  nonce_scheme: 'x',
  aad_scheme: 'y',
  package_url: '/api/v1/lectures/7/offline-package/',
  content_type: 'application/pdf',
};

describe('parseServerLicense', () => {
  it('maps a complete license', () => {
    const parsed = parseServerLicense(licenseJson);

    expect(parsed).toMatchObject({
      licenseId: 'lic-1',
      lectureId: 7,
      fileSize: 304,
      chunkSize: 64,
      sha256: 'abcdef',
    });
  });

  it('refuses incomplete or unsupported licenses', () => {
    expect(parseServerLicense(null)).toBeNull();
    expect(parseServerLicense({ ...licenseJson, content_key: undefined })).toBeNull();
    expect(parseServerLicense({ ...licenseJson, expires_at: 'soon' })).toBeNull();
    expect(parseServerLicense({ ...licenseJson, algorithm: 'ROT13' })).toBeNull();
    expect(parseServerLicense({ ...licenseJson, format_version: 2 })).toBeNull();
    expect(parseServerLicense({ ...licenseJson, file_size: 0 })).toBeNull();
  });
});

describe('evaluateAccess and the clock guard', () => {
  it('is ok while the license is valid, with a renew-soon hint in the last 3 days', () => {
    const e = entry();

    expect(evaluateAccess(e, NOW, guardAt(NOW))).toMatchObject({ kind: 'ok', renewSoon: false });
    expect(evaluateAccess(e, NOW + 12 * DAY, guardAt(NOW + 12 * DAY))).toMatchObject({
      kind: 'ok',
      renewSoon: true,
    });
  });

  it('expires exactly at expires_at', () => {
    const e = entry();
    const at = Date.parse(e.expiresAt);

    expect(evaluateAccess(e, at - 1, guardAt(at - 1)).kind).toBe('ok');
    expect(evaluateAccess(e, at, guardAt(at)).kind).toBe('expired');
  });

  it('blocks when the clock was moved back beyond the tolerance', () => {
    const e = entry();

    expect(evaluateAccess(e, NOW - 2 * DAY, guardAt(NOW))).toEqual({ kind: 'clockRollback' });
    expect(evaluateAccess(e, NOW - CLOCK_ROLLBACK_TOLERANCE_MS - 1, guardAt(NOW)).kind).toBe(
      'clockRollback',
    );
  });

  it('tolerates small clock jitter and never lets it extend a license', () => {
    const e = entry({ expiresAt: new Date(NOW + 1000).toISOString() });
    const jitterNow = NOW - 60_000;

    // Within tolerance: not a rollback, and the highest seen time is used so the license is not extended.
    expect(evaluateAccess(e, jitterNow, guardAt(NOW + 5000)).kind).toBe('expired');
    expect(evaluateAccess(e, jitterNow, guardAt(NOW)).kind).toBe('ok');
  });

  it('expired license stays expired after a rollback attempt inside the tolerance', () => {
    const e = entry({ expiresAt: new Date(NOW).toISOString() });

    expect(evaluateAccess(e, NOW - 5 * 60_000, guardAt(NOW + 1)).kind).toBe('expired');
  });

  it('the guard only moves forward', () => {
    const g = guardAt(NOW);

    expect(observeClock(g, NOW - 5 * DAY).maxSeenMs).toBe(NOW);
    expect(observeClock(g, NOW + DAY).maxSeenMs).toBe(NOW + DAY);
  });

  it('a server anchor clears a rollback only when the device clock is right again', () => {
    const e = entry();
    const rolledBack = guardAt(NOW + 3 * DAY);
    const deviceNow = NOW;

    expect(evaluateAccess(e, deviceNow, rolledBack).kind).toBe('clockRollback');

    const anchored = anchorGuard(rolledBack, NOW, deviceNow);

    expect(anchored).toMatchObject({ maxSeenMs: NOW, lastServerMs: NOW });
    expect(evaluateAccess(e, deviceNow, anchored).kind).toBe('ok');
    // Server says it is NOW but the phone still shows 3 days earlier: still blocked.
    expect(evaluateAccess(e, NOW - 3 * DAY, anchored).kind).toBe('clockRollback');
  });

  it('a clock moved far forward cannot be used to revive anything and expires the license', () => {
    const e = entry();

    expect(evaluateAccess(e, NOW + 30 * DAY, guardAt(NOW)).kind).toBe('expired');
  });
});

describe('deriveItemState', () => {
  const guard = guardAt(NOW);

  it('maps every situation to a button state', () => {
    expect(deriveItemState(undefined, { kind: 'idle' }, NOW, guard)).toEqual({ kind: 'none' });
    expect(
      deriveItemState(undefined, { kind: 'downloading', doneBytes: 1, totalBytes: 2 }, NOW, guard)
        .kind,
    ).toBe('downloading');
    expect(deriveItemState(entry(), { kind: 'idle' }, NOW, guard).kind).toBe('ready');
    expect(
      deriveItemState(
        entry({ status: 'partial', downloadedBytes: 10 }),
        { kind: 'idle' },
        NOW,
        guard,
      ),
    ).toMatchObject({
      kind: 'partial',
      doneBytes: 10,
    });
    expect(
      deriveItemState(
        entry(),
        { kind: 'idle' },
        NOW + 20 * DAY,
        observeClock(guard, NOW + 20 * DAY),
      ).kind,
    ).toBe('expired');
    expect(deriveItemState(entry(), { kind: 'idle' }, NOW - DAY, guard).kind).toBe('clockRollback');
    expect(deriveItemState(entry(), { kind: 'error', reason: 'limitReached' }, NOW, guard)).toEqual(
      {
        kind: 'error',
        reason: 'limitReached',
      },
    );
    expect(deriveItemState(entry(), { kind: 'renewing' }, NOW, guard).kind).toBe('renewing');
  });
});

describe('planSync', () => {
  const guard = guardAt(NOW);
  const a = entry({ lectureId: 1, licenseId: 'a' });
  const b = entry({ lectureId: 2, licenseId: 'b' });
  const c = entry({ lectureId: 3, licenseId: 'c' });

  it('purges what the server says, renews what it says, keeps the rest', () => {
    const plan = planSync([a, b, c], { keep: ['a'], renew: ['b'], purge: ['c'] }, NOW, guard);

    expect(plan.purge).toEqual(['3']);
    expect(plan.renew).toEqual(['2']);
    expect(plan.keep).toEqual(['1']);
  });

  it('purge wins over renew, unknown ids are ignored, unmentioned entries are kept', () => {
    const plan = planSync([a, b], { keep: [], renew: ['a', 'zzz'], purge: ['a'] }, NOW, guard);

    expect(plan.purge).toEqual(['1']);
    expect(plan.renew).toEqual([]);
    expect(plan.keep).toEqual(['2']);
  });

  it('also renews what expires within 3 days, what expired and what the clock guard blocked', () => {
    const soon = entry({
      lectureId: 4,
      licenseId: 'd',
      expiresAt: new Date(NOW + OFFLINE_RENEW_BEFORE_MS - 1000).toISOString(),
    });
    const gone = entry({
      lectureId: 5,
      licenseId: 'e',
      expiresAt: new Date(NOW - 1000).toISOString(),
    });
    const plan = planSync(
      [a, soon, gone],
      { keep: ['a', 'd', 'e'], renew: [], purge: [] },
      NOW,
      guard,
    );

    expect(plan.renew.sort()).toEqual(['4', '5']);
    expect(plan.keep).toEqual(['1']);

    const blocked = planSync([a], { keep: ['a'], renew: [], purge: [] }, NOW - 5 * DAY, guard);

    expect(blocked.renew).toEqual(['1']);
  });

  it('ignores partial downloads for the proactive renewal', () => {
    const partial = entry({
      lectureId: 6,
      licenseId: 'f',
      status: 'partial',
      expiresAt: new Date(NOW - DAY).toISOString(),
    });

    expect(planSync([partial], { keep: [], renew: [], purge: [] }, NOW, guard).renew).toEqual([]);
  });

  it('parses the sync response defensively', () => {
    expect(parseSyncResponse({ keep: ['a', 1], renew: 'x', purge: ['p'] })).toEqual({
      keep: ['a'],
      renew: [],
      purge: ['p'],
    });
    expect(parseSyncResponse(null)).toBeNull();
  });
});

describe('resumable download', () => {
  it('asks for a range with If-Range only when something is already on disk', () => {
    expect(resumeHeaders(0, '"x"')).toEqual({});
    expect(resumeHeaders(100, '"x"')).toEqual({ Range: 'bytes=100-', 'If-Range': '"x"' });
    expect(resumeHeaders(100, null)).toEqual({ Range: 'bytes=100-' });
  });

  it('parses Content-Range', () => {
    expect(parseContentRange('bytes 100-999/1000')).toEqual({ start: 100, end: 999, total: 1000 });
    expect(parseContentRange('bytes 0-9/*')).toEqual({ start: 0, end: 9, total: null });
    expect(parseContentRange('nonsense')).toBeNull();
    expect(parseContentRange(null)).toBeNull();
  });

  it('appends only when the server resumes exactly where the file ends', () => {
    expect(
      decideResume({
        partialBytes: 100,
        totalBytes: 1000,
        status: 206,
        contentRange: 'bytes 100-999/1000',
      }),
    ).toEqual({ action: 'append' });
    expect(
      decideResume({
        partialBytes: 100,
        totalBytes: 1000,
        status: 206,
        contentRange: 'bytes 50-999/1000',
      }),
    ).toEqual({ action: 'fail', reason: 'range' });
    expect(
      decideResume({
        partialBytes: 100,
        totalBytes: 1000,
        status: 206,
        contentRange: 'bytes 100-999/2000',
      }),
    ).toEqual({ action: 'fail', reason: 'range' });
    expect(
      decideResume({ partialBytes: 100, totalBytes: 1000, status: 206, contentRange: null }),
    ).toEqual({ action: 'fail', reason: 'range' });
  });

  it('restarts from zero when the package changed (200 instead of 206) or the range is unsatisfiable', () => {
    expect(
      decideResume({ partialBytes: 100, totalBytes: 1000, status: 200, contentRange: null }),
    ).toEqual({ action: 'restart' });
    expect(
      decideResume({ partialBytes: 100, totalBytes: 1000, status: 416, contentRange: null }),
    ).toEqual({ action: 'restart' });
    expect(
      decideResume({ partialBytes: 1000, totalBytes: 1000, status: 416, contentRange: null }),
    ).toEqual({ action: 'complete' });
    expect(
      decideResume({ partialBytes: 0, totalBytes: 1000, status: 200, contentRange: null }),
    ).toEqual({ action: 'restart' });
  });

  it('fails on other statuses', () => {
    expect(
      decideResume({ partialBytes: 0, totalBytes: 1000, status: 404, contentRange: null }),
    ).toEqual({ action: 'fail', reason: 'status' });
  });
});

describe('storage budget', () => {
  const MB = 1024 * 1024;

  it('counts complete files at full size and partial files at what is on disk', () => {
    expect(
      usedBytes([
        entry({ fileSize: 10 * MB }),
        entry({ status: 'partial', fileSize: 50 * MB, downloadedBytes: 5 * MB }),
      ]),
    ).toBe(15 * MB);
  });

  it('allows what fits and refuses what does not, with the missing amount', () => {
    expect(
      checkStorage({
        usedBytes: 100 * MB,
        incomingBytes: 50 * MB,
        budgetBytes: 200 * MB,
        freeDiskBytes: 5000 * MB,
      }),
    ).toEqual({ ok: true });
    expect(
      checkStorage({
        usedBytes: 180 * MB,
        incomingBytes: 50 * MB,
        budgetBytes: 200 * MB,
        freeDiskBytes: 5000 * MB,
      }),
    ).toEqual({
      ok: false,
      reason: 'budget',
      needBytes: 30 * MB,
    });
  });

  it('does not count bytes of a resumed partial file twice', () => {
    expect(
      checkStorage({
        usedBytes: 190 * MB,
        alreadyHaveBytes: 40 * MB,
        incomingBytes: 50 * MB,
        budgetBytes: 200 * MB,
        freeDiskBytes: null,
      }),
    ).toEqual({ ok: true });
  });

  it('refuses when the phone itself is nearly full', () => {
    const verdict = checkStorage({
      usedBytes: 0,
      incomingBytes: 50 * MB,
      budgetBytes: 1000 * MB,
      freeDiskBytes: 100 * MB,
    });

    expect(verdict).toMatchObject({ ok: false, reason: 'disk' });
    expect(MIN_FREE_DISK_BYTES).toBeGreaterThan(0);
  });

  it('clamps the setting', () => {
    expect(clampBudget(1)).toBe(MIN_BUDGET_BYTES);
    expect(clampBudget(1e15)).toBe(MAX_BUDGET_BYTES);
    expect(clampBudget(Number.NaN)).toBe(DEFAULT_BUDGET_BYTES);
    expect(clampBudget(DEFAULT_BUDGET_BYTES)).toBe(DEFAULT_BUDGET_BYTES);
  });
});

describe('classifyOfflineError', () => {
  it('names the situations the student can act on', () => {
    expect(classifyOfflineError({ status: 409, code: 'offline_limit_reached' })).toBe(
      'limitReached',
    );
    expect(classifyOfflineError({ status: 404 })).toBe('notFound');
    expect(classifyOfflineError({ offline: true })).toBe('offline');
    expect(classifyOfflineError({ status: undefined })).toBe('network');
    expect(classifyOfflineError({ status: 503 })).toBe('network');
    expect(classifyOfflineError({ status: 400 })).toBe('unknown');
  });
});
