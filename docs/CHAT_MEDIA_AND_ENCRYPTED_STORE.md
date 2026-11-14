# Chat media, voice messages and the encrypted file store

Backend contract: `docs/MOBILE_PRODUCT_INTEGRATION.md` of panorama_backend PR #54 (pinned in `contracts/openapi.json`).
This PR must not be merged before backend #54; after it merges, re-sync with `npm run contracts:sync` from main.

## What the student can do

| Feature                    | How                                                                                                                                                                   |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pictures                   | Attach menu -> album / camera. Photos are shrunk on the phone (JPEG, long edge 2048 px) when large so they fit 10 MB. Optimistic bubble with progress, cancel, retry. |
| PDF                        | Attach menu -> "ملف PDF". 25 MB.                                                                                                                                      |
| Audio file                 | Attach menu -> "ملف صوتي" (m4a, mp4, aac, mp3, ogg/opus, wav; 25 MB; webm is refused).                                                                                |
| Voice message              | Mic button (tap to start). Cancel / send in the recording bar. Hard stop at 5 minutes with a visible notice, then send or discard.                                    |
| Opening                    | Pictures and PDFs open only in the in-app secure viewer. Voice and audio play in the bubble.                                                                          |

## Why "tap to record" (not hold-to-record)

There is no gesture-handler in the app. A PanResponder press-and-hold with slide-to-cancel fights the scrolling list, cannot be
used with TalkBack, and is hard to test. Tap-to-start with explicit cancel and send buttons is robust, accessible and testable
(`recorder.ts` is a pure state machine with tests for permissions, cancel and the 300 s cap).

## Opening an attachment (speed and the "فشل التحميل" fix)

What was wrong before: every open asked for a single ticket and loaded the full file through an `Image`/`WebView` with no
thumbnail, no retry, no cache and no distinction between errors; an Android WebView cannot render PDFs at all, so documents
always failed. Now:

1. A screenful of pictures asks for tickets in ONE batch call (`POST .../messages/attachment-tickets/`, <= 20 ids, 40 ms window).
2. The list shows the <= 480 px WebP thumbnail (`?variant=thumb`), sized from the server's width/height so the list never jumps.
3. Opening a picture shows the cached thumbnail at once, then the full image fades in (progressive).
4. Tickets are reused only while far from expiry and under their use limit; opening audio always asks for a fresh ticket.
5. Network and 5xx errors are retried with exponential backoff and jitter; 401 refreshes the token once; 403/404/410 are final and
   evict the cached copy. The viewer shows the shared `ErrorState` with an Arabic reason and a retry button.
6. PDFs are drawn page by page by Android's `PdfRenderer` through the small local module `modules/panorama-pdf`.

## No download / save / share

- No share, save, export, "open with" or long-press save anywhere (`chatMediaSecurity.test.ts` scans the chat and security code).
- The viewer calls `preventScreenCaptureAsync('chat-media-viewer')` (FLAG_SECURE) while open, even in tester builds. The rest of
  the app is already protected by `useSecureScreen` at the root.
- Overlays use `AppModal` (drawn inside the protected main window), never React Native `Modal`.
- The server stream is `Content-Disposition: inline`; tickets are member-bound and short lived.

## Encrypted file store (`src/security`)

Reusable by a later "downloaded lectures" feature: `createEncryptedStore(name, { maxBytes, maxEntryBytes, maxAgeMs })`.

| API                                | Purpose                                                                                      |
| ---------------------------------- | -------------------------------------------------------------------------------------------- |
| `put(id, bytes, meta)`             | Encrypt and store (replaces the same id). Applies size/age limits (LRU).                     |
| `readBytes(id)`                    | Decrypt into memory (thumbnails).                                                            |
| `open(id)` -> `{ uri, release() }` | Decrypt to a temp file in the private cache for viewers that need a path. Call `release()`.  |
| `evict`, `evictPrefix`, `trim`     | Remove entries, apply limits, drop orphans.                                                  |
| `sweepTemp()`                      | Delete decrypted temp files a crash left behind (runs at start).                             |
| `wipe()`                           | Delete everything and the master key (logout, account switch, device replaced).              |

Design: one random 256-bit master key per install in `expo-secure-store` (Android Keystore backed); a random 256-bit key per
file, wrapped by the master key; content in 1 MiB chunks sealed with AES-256-GCM through `expo-crypto`'s native AES (random
96-bit nonce per chunk). The additional data binds each chunk to the file name, position, chunk count and plain size, so
tampering, truncation, reordering or moving a chunk to another file fails authentication and the entry is discarded. The index
(ids, sizes, last access, metadata such as etag/mime) is sealed too; file names on disk are random. Everything is in app-private
`Paths.document` / `Paths.cache`, never external storage; `allowBackup` is already `false`, storage permissions are blocked.

Chat cache: 120 MB cap, 30 days idle limit, 30 MB per entry (a 25 MB lecture recording is streamed, not cached). Revalidation:
a fresh ticket carries the content hash; equal to the stored copy means reuse with no download, otherwise a conditional GET with
`If-None-Match` (304 reuses). Offline reopening serves the cached copy.

Library choice: `react-native-quick-crypto` is a heavy native dependency (Nitro modules) that needs a larger build change;
`@noble/ciphers` is pure JS and would block the JS thread for large files. `expo-crypto` 56 ships native AES-GCM with
additional data and is already in the Expo SDK 56 set, so it is used with chunking for bounded memory.

### Honest limits

- It protects data at rest and in copies of the storage (backup, forensics of a locked device without the Keystore). It does not
  protect against a rooted or compromised phone, a debugger, or the moment of viewing: the decrypted bytes are in memory, and a
  picture/PDF shown in the viewer exists as a temp file in the app's private cache until the viewer closes.
- Screen-capture protection (FLAG_SECURE) does not stop someone photographing the screen with another device.
- Audio is streamed from the protected URL and not stored; the player buffers it in memory/ExoPlayer cache like any stream.
- Uninstalling or clearing app data destroys the Keystore key, so old cached files become unreadable (and are removed).
- The first version of a downloaded-lecture store should also encrypt the lecture's page images; this store is the building block.
