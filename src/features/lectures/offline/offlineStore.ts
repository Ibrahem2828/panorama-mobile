import { Directory, File, Paths } from 'expo-file-system';

import { createEncryptedStore } from '../../../security/encryptedStore';
import type { EncryptedStore } from '../../../security/encryptedStoreCore';
import { emptyInventory, type Inventory, type OfflineEntry, type LectureKey } from './licenseLogic';

/**
 * Where downloaded lectures live (everything app-private, never external storage, `allowBackup` is off):
 *
 *   Paths.document/pano-offline/<random>.pnof           ciphertext packages exactly as the server sent them (PNOF v1)
 *   encrypted store "lectures-offline", id "inventory"  JSON: license, content key, expiry, titles, clock guard. Sealed with
 *                                                        AES-256-GCM under the Keystore-backed master key, so the content key
 *                                                        never sits in plaintext storage
 *   Paths.cache/pano-open/lectures-offline/*.pdf        decrypted copy while the viewer is open only; deleted on close and
 *                                                        swept at start
 *
 * The package is already ciphertext, so it is NOT encrypted a second time.
 */
const INVENTORY_ID = 'inventory';
const PACKAGE_DIR = ['pano-offline'] as const;
const TEMP_DIR = ['pano-open', 'lectures-offline-view'] as const;
const TEN_YEARS_MS = 10 * 365 * 24 * 60 * 60 * 1000;

let store: EncryptedStore | null = null;

function inventoryStore(): EncryptedStore {
  if (!store) {
    store = createEncryptedStore('lectures-offline', {
      maxBytes: 64 * 1024 * 1024,
      maxEntryBytes: 16 * 1024 * 1024,
      maxAgeMs: TEN_YEARS_MS,
    });
  }

  return store;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function packageDirectory(): Directory {
  return new Directory(Paths.document, ...PACKAGE_DIR);
}

export function ensurePackageDirectory(): Directory {
  const directory = packageDirectory();

  directory.create({ intermediates: true, idempotent: true });

  return directory;
}

/** One file per lecture: it grows while downloading (inventory status `partial`) and is complete when the status says so. */
export function packageFile(fileName: string): File {
  return new File(packageDirectory(), fileName);
}

export function newTempFile(): File {
  const directory = new Directory(Paths.cache, ...TEMP_DIR);

  directory.create({ intermediates: true, idempotent: true });

  return new File(
    directory,
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}.pdf`,
  );
}

export function deleteTempFile(uri: string): void {
  try {
    const file = new File(uri);

    if (file.exists) {
      file.delete();
    }
  } catch {
    // Private cache; swept again at the next start.
  }
}

/** Decrypted copies a crash left behind. */
export function sweepDecryptedTemp(): void {
  try {
    const directory = new Directory(Paths.cache, ...TEMP_DIR);

    if (directory.exists) {
      directory.delete();
    }
  } catch {
    // Nothing to sweep.
  }
}

export function freeDiskBytes(): number | null {
  try {
    const free = Paths.availableDiskSpace;

    return Number.isFinite(free) ? free : null;
  } catch {
    return null;
  }
}

export async function readInventory(
  userId: string,
): Promise<{ inventory: Inventory; foreign: boolean }> {
  try {
    const bytes = await inventoryStore().readBytes(INVENTORY_ID);

    if (bytes) {
      const parsed = JSON.parse(decoder.decode(bytes)) as Inventory;

      if (parsed && parsed.v === 1 && parsed.entries) {
        return parsed.userId === userId
          ? { inventory: parsed, foreign: false }
          : { inventory: emptyInventory(userId), foreign: true };
      }
    }
  } catch {
    // Unreadable or tampered inventory: start empty (orphan files are swept by the caller).
  }

  return { inventory: emptyInventory(userId), foreign: false };
}

export async function writeInventory(inventory: Inventory): Promise<void> {
  await inventoryStore().put(INVENTORY_ID, encoder.encode(JSON.stringify(inventory)), {
    userId: inventory.userId,
  });
}

export function deleteEntryFiles(entry: Pick<OfflineEntry, 'fileName'>): void {
  try {
    const file = packageFile(entry.fileName);

    if (file.exists) {
      file.delete();
    }
  } catch {
    // Already gone.
  }
}

/** Deletes package files the inventory does not know (a crash between writing a file and recording it). */
export function sweepOrphanPackages(keep: ReadonlySet<LectureKey> | OfflineEntry[]): void {
  const names = new Set<string>();

  for (const entry of Array.isArray(keep) ? keep : []) {
    names.add(entry.fileName);
  }

  try {
    const directory = packageDirectory();

    if (!directory.exists) {
      return;
    }

    for (const item of directory.list()) {
      if (!names.has(item.name)) {
        item.delete();
      }
    }
  } catch {
    // Best effort.
  }
}

/** Logout, account switch, device replaced: every package, the inventory with its keys, the master key and temp files. */
export async function wipeOfflineStorage(): Promise<void> {
  sweepDecryptedTemp();

  try {
    const directory = packageDirectory();

    if (directory.exists) {
      directory.delete();
    }
  } catch {
    // Best effort; the inventory (and with it every key) is gone below, so leftovers are unreadable ciphertext.
  }

  try {
    await inventoryStore().wipe();
  } catch {
    // Master key removal is the part that matters; retried at the next sign-in.
  }

  store = null;
}
