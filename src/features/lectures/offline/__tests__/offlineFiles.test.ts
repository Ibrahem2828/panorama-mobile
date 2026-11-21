import { readFileSync } from 'node:fs';
import path from 'node:path';

import {
  classifyOfflineError,
  deriveItemState,
  EMPTY_GUARD,
  entryKey,
  entryKind,
  inventoryLicenseIds,
  keyOf,
  parsePreparing,
  parseServerLicense,
  planSync,
  shouldOpenSavedCopy,
  type OfflineEntry,
} from '../licenseLogic';
import {
  issueWithPreparing,
  PreparingCancelledError,
  PreparingTimeoutError,
  type LicenseAttempt,
} from '../preparing';

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.parse('2026-11-21T10:00:00Z');

function entry(over: Partial<OfflineEntry> = {}): OfflineEntry {
  return {
    lectureId: 1,
    title: 'Item',
    subjectName: null,
    pageCount: 10,
    licenseId: 'lic-1',
    keyId: 'k',
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

const fileLicense = {
  license_id: 'lic-f',
  file_id: 5,
  content_key: 'a2V5',
  key_id: '12345678-1234-5678-1234-567812345678',
  package_version: 1,
  issued_at: '2026-11-21T10:00:00Z',
  expires_at: '2026-12-05T10:00:00Z',
  state: 'active',
  file_size: 304,
  sha256_of_ciphertext: 'ABCDEF',
  algorithm: 'AES-256-GCM-chunked',
  format_version: 1,
  header_size: 40,
  chunk_size: 64,
  tag_size: 16,
  plaintext_size: 200,
  package_url: '/api/v1/files/5/offline-package/',
  content_type: 'application/pdf',
};

describe('kind-generalised licenses', () => {
  it('reads file_id for files and refuses a lecture payload as a file license (and the reverse)', () => {
    expect(parseServerLicense(fileLicense, 'file')).toMatchObject({
      lectureId: 5,
      licenseId: 'lic-f',
    });
    expect(parseServerLicense(fileLicense, 'lecture')).toBeNull();
    expect(
      parseServerLicense({ ...fileLicense, file_id: undefined, lecture_id: 5 }, 'file'),
    ).toBeNull();
    expect(parseServerLicense({ ...fileLicense, file_id: undefined, lecture_id: 5 })).toMatchObject(
      {
        lectureId: 5,
      },
    );
  });

  it('keeps lecture keys unchanged and never collides a file with a lecture of the same id', () => {
    expect(keyOf(5)).toBe('5');
    expect(keyOf(5, 'file')).toBe('f:5');
    expect(entryKey(entry({ lectureId: 5 }))).toBe('5');
    expect(entryKey(entry({ lectureId: 5, kind: 'file' }))).toBe('f:5');
    expect(entryKind(entry())).toBe('lecture');
  });

  it('shows the same states for a file as for a lecture, plus preparing', () => {
    const file = entry({ kind: 'file' });

    expect(deriveItemState(file, { kind: 'idle' }, NOW, EMPTY_GUARD)).toMatchObject({
      kind: 'ready',
    });
    expect(deriveItemState(undefined, { kind: 'preparing', attempt: 2 }, NOW, EMPTY_GUARD)).toEqual(
      {
        kind: 'preparing',
        attempt: 2,
      },
    );
    expect(
      deriveItemState(
        entry({ kind: 'file', expiresAt: new Date(NOW - DAY).toISOString() }),
        { kind: 'idle' },
        NOW,
        { ...EMPTY_GUARD, maxSeenMs: NOW },
      ),
    ).toEqual({ kind: 'expired' });
  });
});

describe('sync of files and lectures', () => {
  it('reconciles each kind against its own license ids, purge wins, unknown ids are kept', () => {
    const lecture = entry({ lectureId: 5, licenseId: 'L5' });
    const fileA = entry({ lectureId: 5, kind: 'file', licenseId: 'F5' });
    const fileB = entry({ lectureId: 6, kind: 'file', licenseId: 'F6' });
    const files = [fileA, fileB];

    expect(inventoryLicenseIds(files)).toEqual(['F5', 'F6']);

    const plan = planSync(files, { keep: [], renew: ['F6'], purge: ['F5', 'L5'] }, NOW, {
      ...EMPTY_GUARD,
      maxSeenMs: NOW,
    });

    expect(plan.purge).toEqual(['f:5']);
    expect(plan.renew).toEqual(['f:6']);
    // The lecture keeps its own plan: the file answer cannot purge it.
    expect(
      planSync([lecture], { keep: ['L5'], renew: [], purge: [] }, NOW, {
        ...EMPTY_GUARD,
        maxSeenMs: NOW,
      }),
    ).toEqual({ purge: [], renew: [], keep: ['5'] });
  });

  it('renews a file that expires within three days or sits behind a rolled-back clock', () => {
    const soon = entry({ kind: 'file', expiresAt: new Date(NOW + DAY).toISOString() });

    expect(
      planSync([soon], { keep: ['lic-1'], renew: [], purge: [] }, NOW, {
        ...EMPTY_GUARD,
        maxSeenMs: NOW,
      }).renew,
    ).toEqual(['f:1']);
    expect(
      planSync([entry({ kind: 'file' })], { keep: ['lic-1'], renew: [], purge: [] }, NOW - DAY, {
        ...EMPTY_GUARD,
        maxSeenMs: NOW,
      }).renew,
    ).toEqual(['f:1']);
  });
});

describe('202 preparing', () => {
  it('parses retry_after_seconds within sane bounds and ignores other bodies', () => {
    expect(parsePreparing({ state: 'preparing', retry_after_seconds: 15 })).toEqual({
      delayMs: 15000,
    });
    expect(parsePreparing({ state: 'preparing', retry_after_seconds: 0 })).toEqual({
      delayMs: 2000,
    });
    expect(parsePreparing({ state: 'preparing', retry_after_seconds: 9999 })).toEqual({
      delayMs: 60000,
    });
    expect(parsePreparing({ state: 'preparing' })).toEqual({ delayMs: 15000 });
    expect(parsePreparing(fileLicense)).toBeNull();
    expect(parsePreparing(null)).toBeNull();
  });

  it('repeats the request until the license arrives and reports every wait', async () => {
    const answers: LicenseAttempt<string>[] = [
      { kind: 'preparing', delayMs: 15000 },
      { kind: 'preparing', delayMs: 15000 },
      { kind: 'license', license: 'LICENSE' },
    ];
    const sleeps: number[] = [];
    const seen: number[] = [];
    const license = await issueWithPreparing({
      attempt: async () => answers.shift() as LicenseAttempt<string>,
      sleep: async (ms) => void sleeps.push(ms),
      isCancelled: () => false,
      onPreparing: (attempt) => seen.push(attempt),
    });

    expect(license).toBe('LICENSE');
    expect(sleeps).toEqual([15000, 15000]);
    expect(seen).toEqual([1, 2]);
  });

  it('gives up after the attempt limit and stops when cancelled', async () => {
    const preparing = async (): Promise<LicenseAttempt<string>> => ({
      kind: 'preparing',
      delayMs: 1,
    });

    await expect(
      issueWithPreparing({
        attempt: preparing,
        sleep: async () => undefined,
        isCancelled: () => false,
        maxAttempts: 3,
      }),
    ).rejects.toBeInstanceOf(PreparingTimeoutError);

    let calls = 0;

    await expect(
      issueWithPreparing({
        attempt: preparing,
        sleep: async () => undefined,
        isCancelled: () => calls++ >= 1,
      }),
    ).rejects.toBeInstanceOf(PreparingCancelledError);
  });

  it('propagates a real failure (limit reached, no access) instead of retrying', async () => {
    const attempt = jest.fn().mockRejectedValue(new Error('409'));

    await expect(
      issueWithPreparing({ attempt, sleep: async () => undefined, isCancelled: () => false }),
    ).rejects.toThrow('409');
    expect(attempt).toHaveBeenCalledTimes(1);
  });
});

describe('errors of the file endpoint', () => {
  it('tells the two 409 answers apart and keeps 404 as no access', () => {
    expect(
      classifyOfflineError({
        status: 409,
        code: 'CONFLICT',
        detail: 'The offline file limit was reached.',
      }),
    ).toBe('limitReached');
    expect(
      classifyOfflineError({
        status: 409,
        code: 'CONFLICT',
        detail: 'This file is too large to download for offline study.',
      }),
    ).toBe('tooLarge');
    expect(classifyOfflineError({ status: 404 })).toBe('notFound');
    expect(classifyOfflineError({ offline: true })).toBe('offline');
  });
});

describe('offline routing decision', () => {
  const saved = { status: 'complete' as const };

  it('opens the saved copy when offline, or when the student asked for it', () => {
    expect(shouldOpenSavedCopy({ entry: saved, isOnline: false })).toBe(true);
    expect(shouldOpenSavedCopy({ entry: saved, isOnline: true, requestedOffline: true })).toBe(
      true,
    );
    expect(shouldOpenSavedCopy({ entry: saved, isOnline: true })).toBe(false);
  });

  it('never opens a missing or half-downloaded copy', () => {
    expect(shouldOpenSavedCopy({ entry: undefined, isOnline: false })).toBe(false);
    expect(
      shouldOpenSavedCopy({
        entry: { status: 'partial' },
        isOnline: false,
        requestedOffline: true,
      }),
    ).toBe(false);
  });
});

const ROOT = path.resolve(__dirname, '..', '..', '..', '..', '..');
const read = (file: string) => readFileSync(path.join(ROOT, file), 'utf8');

describe('library files stay inside the same private pipeline', () => {
  it('opens a saved file in the secure offline viewer, before any network call', () => {
    const screen = read('src/features/files/screens/PdfViewerScreen.tsx');

    expect(screen).toMatch(/shouldOpenSavedCopy/u);
    expect(screen).toMatch(/<OfflineLectureViewer[\s\S]*kind="file"/u);
    expect(screen.indexOf('shouldOpenSavedCopy({')).toBeLessThan(
      screen.indexOf('return <OnlinePdfViewer'),
    );
  });

  it('adds no share, save, export or open-with to the file screens and rows', () => {
    const forbidden =
      /expo-sharing|expo-media-library|Share\.share|IntentLauncher|startActivityAsync|downloadAsync|createDownloadTask|Linking\.openURL|onLongPress/u;

    for (const file of [
      'src/features/files/screens/FileDetailsScreen.tsx',
      'src/features/files/screens/PdfViewerScreen.tsx',
      'src/features/files/components/FileCard.tsx',
      'src/features/lectures/offline/OfflineBadge.tsx',
      'src/features/lectures/offline/OfflineHomeCard.tsx',
    ]) {
      expect(read(file)).not.toMatch(forbidden);
    }
  });

  it('downloads file packages only from the trusted /files/ routes and syncs files with the lectures', () => {
    expect(read('src/features/lectures/offline/packageIO.ts')).toMatch(/'\/api\/v1\/files\/'/u);
    expect(read('src/features/lectures/offline/offlineApi.ts')).toMatch(
      /kind === 'file' \? endpoints\.files : endpoints\.lectures/u,
    );
    expect(read('src/features/lectures/offline/offlineLibrary.ts')).toMatch(
      /for \(const kind of \['lecture', 'file'\] as const\)/u,
    );
  });

  it('wipes file copies together with lectures (one inventory, one wipe)', () => {
    expect(read('src/features/lectures/offline/offlineLibrary.ts')).toMatch(
      /export async function wipeOfflineLibrary[\s\S]*wipeOfflineStorage\(\)/u,
    );
    expect(read('src/offline/authSync.ts')).toMatch(/wipeOfflineLectures\(\)/u);
  });
});
