# Offline lectures (downloaded, encrypted, leak-proof)

Backend contract: `docs/OFFLINE_LECTURE_PACKAGES.md` of panorama_backend PR #55 (authoritative for the PNOF v1 format and the
license API). This PR is stacked on #40 (chat media, encrypted store, PDF module): it must merge after #40 and after backend #55,
and the contract must be re-synced from backend main afterwards (`npm run contracts:sync`). Until both are merged,
`contracts/openapi.json` is the #54 pin plus the offline-license paths of #55 (merged by a script, no other change).

## What the student gets

- On every lecture (subject details and the lectures list): **«تنزيل للدراسة بدون إنترنت»**. States: not downloaded, downloading
  (percent, cancel), paused (resume), verifying, saved (size, «متاحة حتى <date>», open, delete), renewing, needs renewal soon,
  expired, clock problem, and the errors (device limit, budget, phone full, damaged file, connection lost, membership gone).
- A saved lecture opens inside the app with no internet (airplane mode, after a cold start). The phone shows an offline banner.
- Account -> **التنزيلات**: every saved lecture with size and expiry, delete one or all, the storage limit (500 MB / 1 GB /
  1.5 GB / 3 GB, default 1.5 GB) and the space used.

## Design

| Piece          | Choice                                                                                                                                                                                                                                                                                                                                                    |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| At rest        | The PNOF package exactly as received (already AES-256-GCM chunked ciphertext) in `Paths.document/pano-offline/<random>.pnof`. Not encrypted twice. No plaintext PDF ever exists there.                                                                                                                                                                    |
| Content key    | In the sealed inventory (encrypted store `lectures-offline`, AES-256-GCM under the Keystore-backed master key from `expo-secure-store`). Never in AsyncStorage or a plain file.                                                                                                                                                                           |
| Download       | `expo/fetch` streaming, `Range` + `If-Range: <etag>` resume into the growing `<name>.pnof` (inventory status `partial` until verified), automatic resume after a dropped connection, restart from zero when the package changed (200 instead of 206), bytes beyond the license `file_size` are an integrity error.                                        |
| Verify         | Size, header vs license (key id, sizes), `sha256_of_ciphertext` (packages up to 96 MB fit memory once), first and last chunk authenticated. Every chunk is authenticated again when the lecture is opened.                                                                                                                                                |
| Open           | Decrypt chunk by chunk (native AES via `expo-crypto`, 32 chunks per batch) into a temp PDF in `Paths.cache/pano-open/lectures-offline-view/`, draw pages with the local `modules/panorama-pdf` (Android `PdfRenderer`). The temp file is deleted when the viewer closes and swept at start.                                                               |
| Screen         | `FLAG_SECURE` (`preventScreenCaptureAsync`) always while open, also in tester builds. No share, save, export, open-with, long-press menu.                                                                                                                                                                                                                 |
| Expiry / clock | `evaluateAccess` compares `expires_at` with `max(now, highest time ever seen)`. A clock moved back more than 10 minutes below the highest seen time blocks opening («انتهت صلاحية التنزيل / وقت الجهاز غير صحيح»). Only a server round trip (license issue or renewal, `issued_at`) re-anchors the mark.                                                  |
| Sync           | At start, on foreground and on reconnect (rate limited to once a minute): `POST offline-licenses/sync/` with the local license ids. `purge` deletes file and key, `renew` renews silently, expiring-within-3-days and clock-blocked copies are renewed too. Unknown answers keep the copy. Renew 404 (membership gone) purges and tells the student once. |
| Wipe           | `src/offline/authSync.ts` wipes every package, the inventory and the master key on sign-out, account switch and device replacement; `initOfflineLibrary` wipes a foreign owner's data found at start.                                                                                                                                                     |
| Device id      | `X-Panorama-Device-Id` is sent on every license and package call, from the secure-store key `panorama.device.id`. Mobile PR #39 (`src/api/deviceIdentity.ts`) uses the same key and header, so the two share one id; this PR carries a tiny helper (`offline/deviceId.ts`) until #39 lands.                                                               |

## Honest limits

- Screenshots by another camera, a rooted phone, or instrumentation reading memory or the Keystore while licensed.
- The same content key is released to every licensed device (backend decision B); a per-user watermark is the recommended future
  deterrent and is not part of this PR.
- Clock guard: an app that is never opened with a correct clock cannot notice a rollback; the license still ends at `expires_at`
  in server time as soon as the phone goes online. Uptime based detection is not available in JS.
- Packages above 96 MB skip the whole-file hash and rely on per-chunk authentication (the opened lecture is always verified).
- Uninstalling or clearing the app destroys the Keystore key; leftover ciphertext is unreadable and swept.

## Tests

`src/features/lectures/offline/__tests__`: PNOF decrypt (cross-language vector made with the backend's own encryptor, node-made
packages, wrong key, bit flips in data/tag/header, truncation, reorder, duplicate, appended chunk, final flag), license state
machine and clock rollback, sync reconciliation, resume decisions and the streamed download loop, storage budget, source level
leak guards (no share/save/export, only private directories, FLAG_SECURE, sign-out wipe).
