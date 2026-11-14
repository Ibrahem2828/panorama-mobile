/**
 * Entry points for the sign-in / sign-out hooks (src/offline/authSync.ts). The library (native file system, crypto) is loaded
 * on first use so importing this file costs nothing and never touches native code in unit tests.
 */
export function startOfflineLectures(userId: string | number): void {
  void import('./offlineLibrary')
    .then((library) => library.initOfflineLibrary(String(userId)))
    .catch(() => undefined);
}

/** Sign-out, account switch, device replaced: deletes every downloaded lecture, its key and the master key. */
export function wipeOfflineLectures(): Promise<void> {
  return import('./offlineLibrary')
    .then((library) => library.wipeOfflineLibrary())
    .catch(() => undefined);
}
