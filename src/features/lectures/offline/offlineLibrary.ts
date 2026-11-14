import { create } from 'zustand';

import { isDeviceOffline } from '../../../offline/networkStore';
import { logger } from '../../../utils/logger';
import { DownloadError, runPackageDownload } from './downloadCore';
import {
  anchorGuard,
  checkStorage,
  clampBudget,
  emptyInventory,
  evaluateAccess,
  inventoryLicenseIds,
  keyOf,
  observeClock,
  planSync,
  usedBytes,
  type ClockGuard,
  type Inventory,
  type LectureKey,
  type OfflineEntry,
  type OfflineErrorKind,
  type ServerLicense,
  type TransferState,
  EMPTY_GUARD,
  DEFAULT_BUDGET_BYTES,
} from './licenseLogic';
import { forgetImportedKeys, nativeChunkOpener, sha256Hex } from './nativeCrypto';
import {
  OfflineLibraryError,
  issueLicense,
  releaseLicense,
  renewLicense,
  syncLicenses,
  toLibraryError,
} from './offlineApi';
import {
  deleteEntryFiles,
  deleteTempFile,
  ensurePackageDirectory,
  freeDiskBytes,
  newTempFile,
  packageFile,
  readInventory,
  sweepDecryptedTemp,
  sweepOrphanPackages,
  wipeOfflineStorage,
  writeInventory,
} from './offlineStore';
import { createPackageRequester, openPackageReader, openTempWriter, PartWriter } from './packageIO';
import {
  assertHeaderMatchesLicense,
  decodeContentKey,
  decryptChunk,
  decryptPackage,
  chunkRange,
  PNOF_HEADER_SIZE,
  PnofError,
  parsePnofHeader,
} from './pnof';

/** Hashing a package needs it in memory once; above this the per-chunk authentication at open time is the integrity check. */
const MAX_HASHED_PACKAGE_BYTES = 96 * 1024 * 1024;
const CLOCK_WRITE_STEP_MS = 60_000;
const SYNC_MIN_INTERVAL_MS = 60_000;

export type LectureRef = {
  id: number;
  title: string;
  subjectName: string | null;
  pageCount: number;
};

type LibraryState = {
  ready: boolean;
  userId: string | null;
  entries: Record<LectureKey, OfflineEntry>;
  guard: ClockGuard;
  budgetBytes: number;
  transfers: Record<LectureKey, TransferState>;
  /** Set when a purge removed something the student had, so the screen can explain it once. */
  notices: { lectureId: number; title: string; reason: 'revoked' | 'corrupt' | 'replaced' }[];
};

const initial: LibraryState = {
  ready: false,
  userId: null,
  entries: {},
  guard: { ...EMPTY_GUARD },
  budgetBytes: DEFAULT_BUDGET_BYTES,
  transfers: {},
  notices: [],
};

export const useOfflineLibrary = create<LibraryState>(() => ({ ...initial }));

const controllers = new Map<LectureKey, AbortController>();
let writeQueue: Promise<unknown> = Promise.resolve();
let lastSyncAt = 0;
let lastClockWrite = 0;

function snapshot(): Inventory {
  const state = useOfflineLibrary.getState();

  return {
    v: 1,
    userId: state.userId ?? '',
    entries: state.entries,
    guard: state.guard,
    budgetBytes: state.budgetBytes,
  };
}

/** Applies a change to the inventory in memory, then seals and writes it. Writes are serialised. */
function commit(change: (inventory: Inventory) => Inventory): Promise<void> {
  const run = async () => {
    const state = useOfflineLibrary.getState();

    if (!state.userId) {
      return;
    }

    const next = change(snapshot());

    useOfflineLibrary.setState({
      entries: next.entries,
      guard: next.guard,
      budgetBytes: next.budgetBytes,
    });
    await writeInventory(next);
  };

  const task = writeQueue.then(run, run);

  writeQueue = task.catch(() => undefined);

  return task;
}

function setTransfer(key: LectureKey, transfer: TransferState): void {
  useOfflineLibrary.setState((state) => {
    const transfers = { ...state.transfers };

    if (transfer.kind === 'idle') {
      delete transfers[key];
    } else {
      transfers[key] = transfer;
    }

    return { transfers };
  });
}

function randomName(): string {
  const bytes = new Uint8Array(12);

  globalThis.crypto.getRandomValues(bytes);

  return `${Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')}.pnof`;
}

async function advanceClock(force = false): Promise<void> {
  const now = Date.now();
  const { guard } = useOfflineLibrary.getState();
  const next = observeClock(guard, now);

  if (next !== guard && (force || now - lastClockWrite >= CLOCK_WRITE_STEP_MS)) {
    lastClockWrite = now;
    await commit((inventory) => ({ ...inventory, guard: observeClock(inventory.guard, now) }));
  }
}

/** Moves the monotonic clock mark forward (app start / foreground), online or not. */
export async function touchOfflineClock(): Promise<void> {
  if (useOfflineLibrary.getState().ready) {
    await advanceClock(true);
  }
}

// --- Lifecycle ------------------------------------------------------------------------------------------------------------

/** Signed in (app start or sign-in): load the sealed inventory, drop leftovers, move the clock mark forward. */
let initInFlight: { userId: string; promise: Promise<void> } | null = null;

export function initOfflineLibrary(userId: string): Promise<void> {
  const current = useOfflineLibrary.getState();

  if (current.ready && current.userId === userId) {
    return Promise.resolve();
  }

  if (initInFlight?.userId === userId) {
    return initInFlight.promise;
  }

  const promise = loadLibrary(userId).finally(() => {
    if (initInFlight?.promise === promise) {
      initInFlight = null;
    }
  });

  initInFlight = { userId, promise };

  return promise;
}

async function loadLibrary(userId: string): Promise<void> {
  try {
    const loaded = await readInventory(userId);
    let inventory = loaded.inventory;

    if (loaded.foreign) {
      // A session ended while the app was closed and another student signed in: nothing of the old one may stay.
      await wipeOfflineStorage();
      inventory = emptyInventory(userId);
    }

    sweepDecryptedTemp();

    // Downloads cut off by a crash stay resumable; every transfer state starts idle.
    const entries = inventory.entries;

    sweepOrphanPackages(Object.values(entries));
    useOfflineLibrary.setState({
      ready: true,
      userId,
      entries,
      guard: observeClock(inventory.guard, Date.now()),
      budgetBytes: clampBudget(inventory.budgetBytes),
      transfers: {},
      notices: [],
    });
    await commit((value) => value);
  } catch (error) {
    logger.warn('Offline library init failed', { message: String(error) });
    useOfflineLibrary.setState({ ready: true, userId, entries: {}, transfers: {} });
  }
}

/** Sign-out, account switch, device replaced: everything goes, including the master key. */
export async function wipeOfflineLibrary(): Promise<void> {
  for (const controller of controllers.values()) {
    controller.abort();
  }

  controllers.clear();
  forgetImportedKeys();
  initInFlight = null;
  useOfflineLibrary.setState({ ...initial });
  writeQueue = Promise.resolve();
  await wipeOfflineStorage();
}

// --- Download -----------------------------------------------------------------------------------------------------------------

function entryFromLicense(
  lecture: LectureRef,
  license: ServerLicense,
  fileName: string,
  downloadedBytes: number,
  etag: string | null,
): OfflineEntry {
  return {
    lectureId: lecture.id,
    title: lecture.title,
    subjectName: lecture.subjectName,
    pageCount: lecture.pageCount,
    licenseId: license.licenseId,
    keyId: license.keyId,
    contentKey: license.contentKey,
    packageVersion: license.packageVersion,
    issuedAt: license.issuedAt,
    expiresAt: license.expiresAt,
    fileSize: license.fileSize,
    plaintextSize: license.plaintextSize,
    chunkSize: license.chunkSize,
    sha256: license.sha256,
    fileName,
    downloadedBytes,
    status: 'partial',
    etag: etag ?? `"${license.sha256}"`,
    completedAt: null,
  };
}

function failureKind(error: unknown): OfflineErrorKind {
  if (error instanceof OfflineLibraryError) {
    return error.kind;
  }

  if (error instanceof DownloadError) {
    switch (error.kind) {
      case 'notFound':
        return 'notFound';
      case 'integrity':
        return 'integrity';
      case 'disk':
        return 'disk';
      default:
        return 'network';
    }
  }

  if (error instanceof PnofError) {
    return 'integrity';
  }

  return 'unknown';
}

/** Checks the stored package: header matches the license, size, whole-file hash (when it fits memory), first and last chunk. */
async function verifyPackage(entry: OfflineEntry, license: ServerLicense): Promise<void> {
  const file = packageFile(entry.fileName, false);

  if (!file.exists || file.size !== license.fileSize) {
    throw new PnofError('size', 'file');
  }

  if (license.fileSize <= MAX_HASHED_PACKAGE_BYTES) {
    const hash = await sha256Hex(await file.bytes());

    if (hash !== license.sha256) {
      throw new PnofError('tamper', 'sha256');
    }
  }

  const reader = openPackageReader(file);

  try {
    const header = parsePnofHeader(await reader.read(0, PNOF_HEADER_SIZE));

    assertHeaderMatchesLicense(header, {
      keyId: license.keyId,
      plaintextSize: license.plaintextSize,
      chunkSize: license.chunkSize,
      fileSize: license.fileSize,
    });

    const key = decodeContentKey(license.contentKey);

    for (const index of new Set([0, header.chunkCount - 1])) {
      const range = chunkRange(header, index);

      await decryptChunk(
        header,
        key,
        index,
        await reader.read(range.start, range.length),
        nativeChunkOpener,
      );
    }
  } finally {
    reader.close();
  }
}

/** Starts (or resumes) downloading one lecture into the encrypted private library. Resolves when it finished or failed. */
export async function downloadLecture(lecture: LectureRef): Promise<void> {
  const key = keyOf(lecture.id);
  const state = useOfflineLibrary.getState();

  if (!state.userId || controllers.has(key)) {
    return;
  }

  const existing = state.entries[key];

  if (existing?.status === 'complete') {
    // Already stored: a renewal is what a stale copy needs, not another download.
    await renewLecture(lecture.id);
    return;
  }

  if (isDeviceOffline()) {
    setTransfer(key, { kind: 'error', reason: 'offline' });
    return;
  }

  const controller = new AbortController();

  controllers.set(key, controller);
  setTransfer(key, {
    kind: 'downloading',
    doneBytes: existing?.downloadedBytes ?? 0,
    totalBytes: existing?.fileSize ?? 0,
  });

  let writer: PartWriter | null = null;

  try {
    const license = await issueLicense(lecture.id);

    // A different package version than the partial file: start over.
    if (existing && (existing.keyId !== license.keyId || existing.sha256 !== license.sha256)) {
      deleteEntryFiles(existing);
    }

    const reuse =
      existing && existing.keyId === license.keyId && existing.sha256 === license.sha256
        ? existing
        : null;
    const fileName = reuse?.fileName ?? randomName();

    ensurePackageDirectory();
    writer = new PartWriter(packageFile(fileName, true));

    const verdict = checkStorage({
      usedBytes: usedBytes(
        Object.values(useOfflineLibrary.getState().entries).filter(
          (entry) => entry.lectureId !== lecture.id,
        ),
      ),
      incomingBytes: license.fileSize,
      alreadyHaveBytes: writer.bytes,
      budgetBytes: useOfflineLibrary.getState().budgetBytes,
      freeDiskBytes: freeDiskBytes(),
    });

    if (!verdict.ok) {
      writer.close();
      deleteEntryFiles({ fileName });
      void releaseLicense(lecture.id).catch(() => undefined);
      setTransfer(key, { kind: 'error', reason: verdict.reason });
      return;
    }

    const draft = entryFromLicense(lecture, license, fileName, writer.bytes, reuse?.etag ?? null);

    await commit((inventory) => ({
      ...inventory,
      entries: { ...inventory.entries, [key]: draft },
      guard: anchorGuard(inventory.guard, Date.parse(license.issuedAt), Date.now()),
    }));

    const part = writer;
    let lastTick = 0;
    const result = await runPackageDownload(
      { totalBytes: license.fileSize, etag: draft.etag },
      {
        request: createPackageRequester(license.packageUrl, controller.signal),
        partialBytes: () => part.bytes,
        truncate: () => part.truncate(),
        append: (bytes) => part.append(bytes),
        isCancelled: () => controller.signal.aborted,
        onProgress: (doneBytes, totalBytes) => {
          const now = Date.now();

          if (now - lastTick >= 150 || doneBytes === totalBytes) {
            lastTick = now;
            setTransfer(key, { kind: 'downloading', doneBytes, totalBytes });
          }
        },
        persist: async (doneBytes, etag) => {
          await commit((inventory) => {
            const row = inventory.entries[key];

            return row
              ? {
                  ...inventory,
                  entries: {
                    ...inventory.entries,
                    [key]: { ...row, downloadedBytes: doneBytes, etag: etag ?? row.etag },
                  },
                }
              : inventory;
          });
        },
        sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
      },
    );

    part.close();
    setTransfer(key, { kind: 'verifying' });

    const finalFile = packageFile(fileName, false);

    if (finalFile.exists) {
      finalFile.delete();
    }

    packageFile(fileName, true).move(finalFile);

    const finished: OfflineEntry = {
      ...draft,
      downloadedBytes: license.fileSize,
      etag: result.etag ?? draft.etag,
      status: 'complete',
      completedAt: Date.now(),
    };

    await verifyPackage(finished, license);
    await commit((inventory) => ({
      ...inventory,
      entries: { ...inventory.entries, [key]: finished },
    }));
    setTransfer(key, { kind: 'idle' });
  } catch (error) {
    writer?.close();

    if (error instanceof DownloadError && error.kind === 'cancelled') {
      await discardEntry(lecture.id, { release: true });
      setTransfer(key, { kind: 'idle' });
    } else {
      const kind = failureKind(error);

      if (kind === 'integrity') {
        await discardEntry(lecture.id, { release: false });
      }

      setTransfer(key, { kind: 'error', reason: kind });
    }
  } finally {
    controllers.delete(key);
  }
}

/** Stops a running download and discards what was fetched. */
export function cancelDownload(lectureId: number): void {
  controllers.get(keyOf(lectureId))?.abort();
}

export function clearTransferError(lectureId: number): void {
  const key = keyOf(lectureId);

  if (useOfflineLibrary.getState().transfers[key]?.kind === 'error') {
    setTransfer(key, { kind: 'idle' });
  }
}

// --- Removal ---------------------------------------------------------------------------------------------------------------------

async function discardEntry(
  lectureId: number,
  options: { release: boolean; notice?: 'revoked' | 'corrupt' | 'replaced' },
): Promise<void> {
  const key = keyOf(lectureId);
  const entry = useOfflineLibrary.getState().entries[key];

  if (!entry) {
    return;
  }

  deleteEntryFiles(entry);
  await commit((inventory) => {
    const entries = { ...inventory.entries };

    delete entries[key];

    return { ...inventory, entries };
  });

  if (options.notice) {
    const notice = { lectureId, title: entry.title, reason: options.notice };

    useOfflineLibrary.setState((state) => ({ notices: [...state.notices, notice] }));
  }

  if (options.release && !isDeviceOffline()) {
    void releaseLicense(lectureId).catch(() => undefined);
  }
}

/** The student deletes one downloaded lecture (frees the device slot on the server when online). */
export async function deleteDownload(lectureId: number): Promise<void> {
  cancelDownload(lectureId);
  await discardEntry(lectureId, { release: true });
}

export async function deleteAllDownloads(): Promise<void> {
  const ids = Object.values(useOfflineLibrary.getState().entries).map((entry) => entry.lectureId);

  for (const id of ids) {
    await deleteDownload(id);
  }
}

export function dismissNotices(): void {
  useOfflineLibrary.setState({ notices: [] });
}

export async function setBudget(bytes: number): Promise<void> {
  await commit((inventory) => ({ ...inventory, budgetBytes: clampBudget(bytes) }));
}

// --- Renewal and sync ---------------------------------------------------------------------------------------------------------

/**
 * Renews a stored lecture. 404 means the membership is gone: the copy is purged. A server package that changed since the copy
 * was made (new key) cannot be opened with the new key, so the old copy is replaced by a fresh download.
 */
export async function renewLecture(lectureId: number): Promise<'renewed' | 'purged' | 'replaced'> {
  const key = keyOf(lectureId);
  const entry = useOfflineLibrary.getState().entries[key];

  if (!entry) {
    return 'purged';
  }

  setTransfer(key, { kind: 'renewing' });

  try {
    const license = await renewLicense(lectureId);

    if (license.keyId !== entry.keyId || license.sha256 !== entry.sha256) {
      await discardEntry(lectureId, { release: false });
      setTransfer(key, { kind: 'idle' });
      await downloadLecture({
        id: lectureId,
        title: entry.title,
        subjectName: entry.subjectName,
        pageCount: entry.pageCount,
      });

      return 'replaced';
    }

    await commit((inventory) => {
      const row = inventory.entries[key];

      return row
        ? {
            ...inventory,
            entries: {
              ...inventory.entries,
              [key]: {
                ...row,
                licenseId: license.licenseId,
                contentKey: license.contentKey,
                issuedAt: license.issuedAt,
                expiresAt: license.expiresAt,
              },
            },
            guard: anchorGuard(inventory.guard, Date.parse(license.issuedAt), Date.now()),
          }
        : inventory;
    });
    setTransfer(key, { kind: 'idle' });

    return 'renewed';
  } catch (error) {
    const failure = toLibraryError(error);

    if (failure.kind === 'notFound') {
      await discardEntry(lectureId, { release: false, notice: 'revoked' });
      setTransfer(key, { kind: 'idle' });

      return 'purged';
    }

    setTransfer(key, { kind: 'error', reason: failure.kind });
    throw failure;
  }
}

/**
 * Online reconciliation: asks the server about the local inventory and acts on `purge` (delete file and key), `renew`
 * (silently renew) and keeps the rest. Safe to call often; it is rate limited and does nothing offline.
 */
export async function syncOfflineLibrary(options: { force?: boolean } = {}): Promise<void> {
  const state = useOfflineLibrary.getState();
  const now = Date.now();

  if (!state.ready || !state.userId || isDeviceOffline()) {
    return;
  }

  if (!options.force && now - lastSyncAt < SYNC_MIN_INTERVAL_MS) {
    return;
  }

  const entries = Object.values(state.entries).filter((entry) => entry.status === 'complete');

  lastSyncAt = now;
  await advanceClock();

  if (entries.length === 0) {
    return;
  }

  try {
    const response = await syncLicenses(inventoryLicenseIds(entries));
    const plan = planSync(entries, response, now, useOfflineLibrary.getState().guard);

    for (const key of plan.purge) {
      await discardEntry(Number(key), { release: false, notice: 'revoked' });
    }

    for (const key of plan.renew) {
      try {
        await renewLecture(Number(key));
      } catch {
        // Stays as it is (still readable until it expires); the next sync tries again.
      }
    }
  } catch (error) {
    logger.warn('Offline library sync failed', { message: String(error) });
  }
}

// --- Opening ----------------------------------------------------------------------------------------------------------------------

export type OpenBlock = 'expired' | 'clockRollback' | 'missing' | 'corrupt' | 'cancelled';

export class OfflineOpenError extends Error {
  readonly reason: OpenBlock;

  constructor(reason: OpenBlock) {
    super(`Cannot open: ${reason}`);
    this.reason = reason;
  }
}

export type OpenedLecture = { uri: string; entry: OfflineEntry; release(): void };

/**
 * Decrypts a stored lecture into a temp PDF in the private cache for the viewer. Works fully offline. Refuses (without touching
 * the package) when the license expired or the clock was moved back; an expired or blocked copy needs an online renewal.
 */
export async function openDownloadedLecture(
  lectureId: number,
  options: { onProgress?: (done: number, total: number) => void; isCancelled?: () => boolean } = {},
): Promise<OpenedLecture> {
  const entry = useOfflineLibrary.getState().entries[keyOf(lectureId)];

  if (!entry || entry.status !== 'complete') {
    throw new OfflineOpenError('missing');
  }

  const now = Date.now();
  const access = evaluateAccess(entry, now, useOfflineLibrary.getState().guard);

  if (access.kind === 'clockRollback') {
    throw new OfflineOpenError('clockRollback');
  }

  await advanceClock(true);

  if (access.kind === 'expired') {
    throw new OfflineOpenError('expired');
  }

  const source = packageFile(entry.fileName, false);

  if (!source.exists) {
    await discardEntry(lectureId, { release: false, notice: 'corrupt' });
    throw new OfflineOpenError('missing');
  }

  const temp = newTempFile();
  const reader = openPackageReader(source);
  let writer: ReturnType<typeof openTempWriter> | null = null;

  try {
    const header = parsePnofHeader(await reader.read(0, PNOF_HEADER_SIZE));

    assertHeaderMatchesLicense(header, {
      keyId: entry.keyId,
      plaintextSize: entry.plaintextSize,
      chunkSize: entry.chunkSize,
      fileSize: entry.fileSize,
    });
    writer = openTempWriter(temp);

    const sink = writer;

    await decryptPackage(
      header,
      decodeContentKey(entry.contentKey),
      reader,
      { write: (bytes) => sink.write(bytes) },
      nativeChunkOpener,
      { batchChunks: 32, onProgress: options.onProgress, isCancelled: options.isCancelled },
    );
    writer.close();
    writer = null;
    reader.close();

    return { uri: temp.uri, entry, release: () => deleteTempFile(temp.uri) };
  } catch (error) {
    writer?.close();
    reader.close();
    deleteTempFile(temp.uri);

    if (error instanceof PnofError) {
      if (error.failure === 'cancelled') {
        throw new OfflineOpenError('cancelled');
      }

      // Tampered, truncated or the wrong key: the copy is useless, remove it and let the student download it again.
      await discardEntry(lectureId, { release: false, notice: 'corrupt' });
      throw new OfflineOpenError('corrupt');
    }

    throw error;
  }
}
