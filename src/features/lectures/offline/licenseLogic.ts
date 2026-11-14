/**
 * Pure rules of the offline lecture library: license parsing, the access state machine with a clock-rollback guard,
 * sync reconciliation, resume decisions for the ranged download, storage budget and the per-lecture button state.
 * No native modules here, so every rule is unit tested.
 */

export type LectureKey = string;

export const OFFLINE_RENEW_BEFORE_MS = 3 * 24 * 60 * 60 * 1000;
/** A wall clock may jitter (NTP corrections, DST bugs of cheap phones) without that being an attack. */
export const CLOCK_ROLLBACK_TOLERANCE_MS = 10 * 60 * 1000;
export const DEFAULT_BUDGET_BYTES = 1.5 * 1024 * 1024 * 1024;
export const MIN_BUDGET_BYTES = 200 * 1024 * 1024;
export const MAX_BUDGET_BYTES = 8 * 1024 * 1024 * 1024;
/** Keep this much free on the phone itself, whatever the budget says. */
export const MIN_FREE_DISK_BYTES = 150 * 1024 * 1024;

// --- License as the server sends it ------------------------------------------------------------------------------------

export type ServerLicense = {
  licenseId: string;
  lectureId: number;
  contentKey: string;
  keyId: string;
  packageVersion: number;
  issuedAt: string;
  expiresAt: string;
  state: string;
  fileSize: number;
  sha256: string;
  algorithm: string;
  formatVersion: number;
  headerSize: number;
  chunkSize: number;
  tagSize: number;
  plaintextSize: number;
  packageUrl: string;
  contentType: string;
};

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const text = (value: unknown): string | null =>
  typeof value === 'string' && value.length > 0 ? value : null;

const count = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null;

/** Returns null for anything that is not a complete, supported license (never trust a half-filled one). */
export function parseServerLicense(data: unknown): ServerLicense | null {
  const row = asRecord(data);

  if (!row) {
    return null;
  }

  const licenseId = text(row.license_id);
  const contentKey = text(row.content_key);
  const keyId = text(row.key_id);
  const issuedAt = text(row.issued_at);
  const expiresAt = text(row.expires_at);
  const sha256 = text(row.sha256_of_ciphertext);
  const packageUrl = text(row.package_url);
  const lectureId = count(row.lecture_id);
  const fileSize = count(row.file_size);
  const chunkSize = count(row.chunk_size);
  const plaintextSize = count(row.plaintext_size);

  if (
    !licenseId ||
    !contentKey ||
    !keyId ||
    !issuedAt ||
    !expiresAt ||
    !sha256 ||
    !packageUrl ||
    lectureId === null ||
    fileSize === null ||
    fileSize <= 0 ||
    chunkSize === null ||
    chunkSize <= 0 ||
    plaintextSize === null ||
    plaintextSize <= 0 ||
    Number.isNaN(Date.parse(expiresAt)) ||
    Number.isNaN(Date.parse(issuedAt))
  ) {
    return null;
  }

  const algorithm = text(row.algorithm) ?? '';
  const formatVersion = count(row.format_version) ?? 1;
  const headerSize = count(row.header_size) ?? 40;
  const tagSize = count(row.tag_size) ?? 16;

  if (
    algorithm !== 'AES-256-GCM-chunked' ||
    formatVersion !== 1 ||
    headerSize !== 40 ||
    tagSize !== 16
  ) {
    return null;
  }

  return {
    licenseId,
    lectureId,
    contentKey,
    keyId,
    packageVersion: count(row.package_version) ?? 1,
    issuedAt,
    expiresAt,
    state: text(row.state) ?? 'active',
    fileSize,
    sha256: sha256.toLowerCase(),
    algorithm,
    formatVersion,
    headerSize,
    chunkSize,
    tagSize,
    plaintextSize,
    packageUrl,
    contentType: text(row.content_type) ?? 'application/pdf',
  };
}

// --- Local inventory ------------------------------------------------------------------------------------------------------

export type OfflineEntry = {
  lectureId: number;
  title: string;
  subjectName: string | null;
  pageCount: number;
  licenseId: string;
  keyId: string;
  /** base64 of the 32 byte key. The whole inventory lives inside the encrypted store, never in plain storage. */
  contentKey: string;
  packageVersion: number;
  issuedAt: string;
  expiresAt: string;
  fileSize: number;
  plaintextSize: number;
  chunkSize: number;
  sha256: string;
  /** Random name of the ciphertext file inside the private offline folder. */
  fileName: string;
  /** Bytes of the package already on disk (the file name is `${fileName}.part` until complete). */
  downloadedBytes: number;
  status: 'partial' | 'complete';
  etag: string | null;
  completedAt: number | null;
};

export type ClockGuard = {
  /** Highest wall-clock (or server) time this install has seen. The clock is never trusted to go below it. */
  maxSeenMs: number;
  lastServerMs: number | null;
  lastSyncMs: number | null;
};

export const EMPTY_GUARD: ClockGuard = { maxSeenMs: 0, lastServerMs: null, lastSyncMs: null };

export type Inventory = {
  v: 1;
  userId: string;
  entries: Record<LectureKey, OfflineEntry>;
  guard: ClockGuard;
  budgetBytes: number;
};

export function emptyInventory(userId: string): Inventory {
  return {
    v: 1,
    userId,
    entries: {},
    guard: { ...EMPTY_GUARD },
    budgetBytes: DEFAULT_BUDGET_BYTES,
  };
}

export const keyOf = (lectureId: number | string): LectureKey => String(lectureId);

// --- Access state machine (works fully offline) -------------------------------------------------------------------------

export type AccessState =
  | { kind: 'ok'; msLeft: number; renewSoon: boolean }
  | { kind: 'expired'; msOver: number }
  | { kind: 'clockRollback' };

/**
 * Decides whether a complete download may be opened right now. The decision uses only local data:
 *  - the device clock moved back past the highest time ever seen -> `clockRollback` (blocked until a server round trip
 *    re-anchors the guard, see `anchorGuard`);
 *  - otherwise `expires_at` is compared with max(now, highest seen), so a rollback inside the tolerance cannot extend a license.
 */
export function evaluateAccess(
  entry: Pick<OfflineEntry, 'expiresAt'>,
  nowMs: number,
  guard: ClockGuard,
): AccessState {
  if (nowMs < guard.maxSeenMs - CLOCK_ROLLBACK_TOLERANCE_MS) {
    return { kind: 'clockRollback' };
  }

  const expires = Date.parse(entry.expiresAt);
  const effectiveNow = Math.max(nowMs, guard.maxSeenMs);

  if (Number.isNaN(expires) || effectiveNow >= expires) {
    return { kind: 'expired', msOver: Number.isNaN(expires) ? 0 : effectiveNow - expires };
  }

  return {
    kind: 'ok',
    msLeft: expires - effectiveNow,
    renewSoon: expires - effectiveNow <= OFFLINE_RENEW_BEFORE_MS,
  };
}

/** Records that the clock showed `nowMs`. Never lowers the mark. Call on open, on foreground and on every sync. */
export function observeClock(guard: ClockGuard, nowMs: number): ClockGuard {
  return nowMs > guard.maxSeenMs ? { ...guard, maxSeenMs: nowMs } : guard;
}

/**
 * A server round trip (license issue or renewal) tells the true time (`issued_at`). That is the only thing allowed to
 * clear a rollback: the mark is set to the server time. A device clock that is still wrong afterwards simply stays blocked.
 */
export function anchorGuard(guard: ClockGuard, serverMs: number, nowMs: number): ClockGuard {
  return { maxSeenMs: serverMs, lastServerMs: serverMs, lastSyncMs: nowMs };
}

// --- Button / list state ----------------------------------------------------------------------------------------------------

export type TransferState =
  | { kind: 'idle' }
  | { kind: 'downloading'; doneBytes: number; totalBytes: number }
  | { kind: 'verifying' }
  | { kind: 'renewing' }
  | { kind: 'error'; reason: string };

export type ItemState =
  | { kind: 'none' }
  | { kind: 'downloading'; doneBytes: number; totalBytes: number }
  | { kind: 'verifying' }
  | { kind: 'renewing' }
  | { kind: 'partial'; doneBytes: number; totalBytes: number }
  | { kind: 'ready'; expiresAt: string; sizeBytes: number; renewSoon: boolean }
  | { kind: 'expired' }
  | { kind: 'clockRollback' }
  | { kind: 'error'; reason: string };

export function deriveItemState(
  entry: OfflineEntry | undefined,
  transfer: TransferState,
  nowMs: number,
  guard: ClockGuard,
): ItemState {
  if (
    transfer.kind === 'downloading' ||
    transfer.kind === 'verifying' ||
    transfer.kind === 'renewing'
  ) {
    return transfer;
  }

  if (transfer.kind === 'error') {
    return transfer;
  }

  if (!entry) {
    return { kind: 'none' };
  }

  if (entry.status === 'partial') {
    return { kind: 'partial', doneBytes: entry.downloadedBytes, totalBytes: entry.fileSize };
  }

  const access = evaluateAccess(entry, nowMs, guard);

  if (access.kind === 'clockRollback') {
    return { kind: 'clockRollback' };
  }

  if (access.kind === 'expired') {
    return { kind: 'expired' };
  }

  return {
    kind: 'ready',
    expiresAt: entry.expiresAt,
    sizeBytes: entry.fileSize,
    renewSoon: access.renewSoon,
  };
}

// --- Sync reconciliation -----------------------------------------------------------------------------------------------------

export type SyncResponse = { keep: string[]; renew: string[]; purge: string[] };

export function parseSyncResponse(data: unknown): SyncResponse | null {
  const row = asRecord(data);

  if (!row) {
    return null;
  }

  const list = (value: unknown): string[] =>
    Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

  return { keep: list(row.keep), renew: list(row.renew), purge: list(row.purge) };
}

export type SyncPlan = {
  purge: LectureKey[];
  renew: LectureKey[];
  keep: LectureKey[];
};

/**
 * Turns the server's verdict into local actions. `purge` wins over everything. Besides the server's `renew` list we renew
 * what expires within 3 days and what the clock guard blocked (a rollback is only cleared by a server round trip). Entries the
 * server did not mention are kept: an unknown answer must never delete a student's lecture.
 */
export function planSync(
  entries: OfflineEntry[],
  response: SyncResponse,
  nowMs: number,
  guard: ClockGuard,
): SyncPlan {
  const byLicense = new Map(entries.map((entry) => [entry.licenseId, entry]));
  const purge = new Set<LectureKey>();
  const renew = new Set<LectureKey>();

  for (const id of response.purge) {
    const entry = byLicense.get(id);

    if (entry) {
      purge.add(keyOf(entry.lectureId));
    }
  }

  for (const id of response.renew) {
    const entry = byLicense.get(id);

    if (entry && !purge.has(keyOf(entry.lectureId))) {
      renew.add(keyOf(entry.lectureId));
    }
  }

  for (const entry of entries) {
    const key = keyOf(entry.lectureId);

    if (entry.status !== 'complete' || purge.has(key) || renew.has(key)) {
      continue;
    }

    const access = evaluateAccess(entry, nowMs, guard);

    if (access.kind !== 'ok' || access.renewSoon) {
      renew.add(key);
    }
  }

  const keep = entries
    .map((entry) => keyOf(entry.lectureId))
    .filter((key) => !purge.has(key) && !renew.has(key));

  return { purge: [...purge], renew: [...renew], keep };
}

/** Licence ids to send to `offline-licenses/sync/` (the server accepts 500). Partial downloads hold no usable license. */
export function inventoryLicenseIds(entries: OfflineEntry[]): string[] {
  return entries.map((entry) => entry.licenseId).slice(0, 500);
}

// --- Resumable download -----------------------------------------------------------------------------------------------------------

export function resumeHeaders(partialBytes: number, etag: string | null): Record<string, string> {
  if (partialBytes <= 0) {
    return {};
  }

  return { Range: `bytes=${partialBytes}-`, ...(etag ? { 'If-Range': etag } : {}) };
}

export type ResumeDecision =
  | { action: 'append' }
  | { action: 'restart' }
  | { action: 'complete' }
  | { action: 'fail'; reason: 'status' | 'range' };

export function parseContentRange(
  value: string | null,
): { start: number; end: number; total: number | null } | null {
  const match = /^bytes (\d+)-(\d+)\/(\d+|\*)$/u.exec((value ?? '').trim());

  if (!match) {
    return null;
  }

  return {
    start: Number(match[1]),
    end: Number(match[2]),
    total: match[3] === '*' ? null : Number(match[3]),
  };
}

/**
 * What to do with the body of the response to a (possibly ranged) package request:
 *  206 starting exactly at our offset -> append; 200 (server ignored Range or If-Range failed: package changed) -> restart
 *  from zero; 416 with everything already on disk -> complete, else restart.
 */
export function decideResume(input: {
  partialBytes: number;
  totalBytes: number;
  status: number;
  contentRange: string | null;
}): ResumeDecision {
  const { partialBytes, totalBytes, status, contentRange } = input;

  if (status === 416) {
    return partialBytes === totalBytes ? { action: 'complete' } : { action: 'restart' };
  }

  if (status === 200) {
    return { action: 'restart' };
  }

  if (status === 206) {
    const range = parseContentRange(contentRange);

    if (
      range &&
      range.start === partialBytes &&
      (range.total === null || range.total === totalBytes)
    ) {
      return { action: 'append' };
    }

    return { action: 'fail', reason: 'range' };
  }

  return { action: 'fail', reason: 'status' };
}

// --- Storage budget -------------------------------------------------------------------------------------------------------------

export function usedBytes(entries: OfflineEntry[]): number {
  return entries.reduce(
    (sum, entry) => sum + (entry.status === 'complete' ? entry.fileSize : entry.downloadedBytes),
    0,
  );
}

export function clampBudget(bytes: number): number {
  if (!Number.isFinite(bytes)) {
    return DEFAULT_BUDGET_BYTES;
  }

  return Math.min(MAX_BUDGET_BYTES, Math.max(MIN_BUDGET_BYTES, Math.round(bytes)));
}

export type StorageVerdict =
  | { ok: true }
  | { ok: false; reason: 'budget'; needBytes: number }
  | { ok: false; reason: 'disk'; needBytes: number };

/** May `incomingBytes` more be stored? `alreadyHaveBytes` is what a resumed partial file already counts for. */
export function checkStorage(input: {
  usedBytes: number;
  incomingBytes: number;
  alreadyHaveBytes?: number;
  budgetBytes: number;
  freeDiskBytes: number | null;
}): StorageVerdict {
  const extra = Math.max(0, input.incomingBytes - (input.alreadyHaveBytes ?? 0));

  if (input.usedBytes + extra > input.budgetBytes) {
    return { ok: false, reason: 'budget', needBytes: input.usedBytes + extra - input.budgetBytes };
  }

  if (input.freeDiskBytes !== null && extra + MIN_FREE_DISK_BYTES > input.freeDiskBytes) {
    return {
      ok: false,
      reason: 'disk',
      needBytes: extra + MIN_FREE_DISK_BYTES - input.freeDiskBytes,
    };
  }

  return { ok: true };
}

// --- Error kinds ------------------------------------------------------------------------------------------------------------------

export type OfflineErrorKind =
  | 'limitReached'
  | 'notFound'
  | 'offline'
  | 'budget'
  | 'disk'
  | 'integrity'
  | 'network'
  | 'unknown';

/** Maps an API error (status + backend code) to what the student is told. */
export function classifyOfflineError(input: {
  status?: number | null;
  code?: string | null;
  offline?: boolean;
}): OfflineErrorKind {
  if (input.offline) {
    return 'offline';
  }

  if (input.status === 409 && (input.code ?? '').toLowerCase().includes('offline_limit')) {
    return 'limitReached';
  }

  if (input.status === 404 || input.status === 403) {
    return 'notFound';
  }

  if (
    input.status === undefined ||
    input.status === null ||
    input.status === 0 ||
    (input.status ?? 0) >= 500
  ) {
    return 'network';
  }

  return 'unknown';
}
