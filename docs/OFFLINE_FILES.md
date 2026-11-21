# Offline library files (study without internet)

Backend contract: `docs/OFFLINE_FILES.md` of panorama_backend (PR #60, merged at 03abe12). The package format (PNOF v1), the license
rules and the clock guard are exactly those of offline lectures (see `OFFLINE_LECTURES.md`); the app uses ONE stack for both kinds.

## One stack, two kinds

`src/features/lectures/offline/` is generalised by `OfflineKind = 'lecture' | 'file'`:

| Piece                | How the kind is carried                                                                                                                                    |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Inventory key        | `keyOf(id, kind)`: lectures keep the plain id (old inventories stay valid), files use `f:<id>`. `OfflineEntry.kind` is optional (absent = lecture).        |
| License API          | `offlineApi.ts` picks `endpoints.lectures` or `endpoints.files`; the file payload carries `file_id` (parsed by `parseServerLicense(data, 'file')`).        |
| 202 `preparing`      | `issueWithPreparing` repeats the license request every `retry_after_seconds` (clamped 2-60 s, max 60 attempts) while the server builds a big file package. |
| Sync                 | `syncOfflineLibrary` calls `lectures/offline-licenses/sync/` and `files/offline-licenses/sync/` separately (one failing route never blocks the other).     |
| Wipe                 | One inventory, one wipe (`wipeOfflineLibrary`): sign-out, account switch, device replaced (DEVICE_MISMATCH / SESSION_REVOKED_BY_ADMIN) clear files too.    |
| Budget / clock guard | Shared: the storage budget counts lectures and files together, the clock guard is one per install.                                                         |
| Viewer               | `OfflineLectureViewer kind="file"`: same PdfRenderer path, `FLAG_SECURE`, temp file removed on close.                                                      |

## What the student gets

- File details: **«تنزيل للدراسة بدون إنترنت»** with every state (preparing, downloading with cancel/resume, saved + validity, renew, expired, errors, delete).
- File rows show a small «متاح بدون إنترنت» badge once a valid copy exists.
- Opening a file (`PdfViewer`) with a saved copy and no connection opens the saved copy with no network call first.
- Home: **«المتاح بدون إنترنت»** card (counts of saved files and lectures) -> Downloads (lists lectures and files, sizes, validity).
  The card also shows when Home itself could not load.
- Offline list fixes: a files query that was never loaded no longer keeps showing the previous query's rows; group files stay visible
  when an unrelated detail request failed; file details also look in the paged list.

## Tests

`__tests__/offlineFiles.test.ts` (kind keys, license parsing, sync reconciliation per kind, 202 polling/timeout/cancel, 409 classification,
offline routing decision, source guards) plus `filesStore.test.ts` (offline list fallback).
