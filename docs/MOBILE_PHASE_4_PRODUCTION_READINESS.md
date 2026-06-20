# Mobile Phase 4: Production Readiness Report

**Date:** 2026-06-20  
**App version:** 0.1.0 (`versionCode` 1)  
**SDK:** Expo 56 / React Native 0.85  
**Backend (dev/preview):** `http://eby52x8qksscjvfeqxf0eob7.76.13.155.172.sslip.io`

---

## Executive Summary

Phase 4 executed static preflight, EAS/build audits, backend reachability probes, Expo Metro smoke, and code-path review across all 13 workstreams. **No P0/P1 runtime bugs were found or fixed** in this pass because the live backend was unreachable from the QA environment and full on-device flows require authenticated student credentials on a physical device or emulator.

**Final verdict: NEEDS MINOR FIXES** — preview/internal Android APK is **config-ready**; **production store release is blocked** until HTTPS/WSS URLs are configured and manual device QA completes with a reachable backend.

---

## 1. Production Readiness Report

Legend: **PASS** | **FAIL** | **STATIC** (code review only) | **BLOCKED** (external dependency) | **MANUAL** (requires device + credentials)

### Workstream 0 — Static Preflight

| Check                        | Result   | Notes                                                                       |
| ---------------------------- | -------- | --------------------------------------------------------------------------- |
| `npm run typecheck`          | **PASS** | Clean                                                                       |
| `npm run lint`               | **PASS** | Clean                                                                       |
| `npm run format:check`       | **FAIL** | 52 files with Prettier drift (pre-existing; non-blocking for runtime)       |
| `npm run expo:config`        | **PASS** | Resolves icon, adaptiveIcon, favicon, bundle IDs, cleartext plugin          |
| Asset registry (`images.ts`) | **PASS** | 63 PNG assets present; `expectedImageAssetPaths` aligned                    |
| Production env guard         | **PASS** | `assertClientEnvForRelease()` throws on `production` + HTTP API (by design) |
| Preview env with HTTP        | **PASS** | Allowed for internal QA when EAS injects explicit API/WS URLs               |

### Workstream 1 — Backend API Smoke

| Endpoint                                            | Result      | Notes                                            |
| --------------------------------------------------- | ----------- | ------------------------------------------------ |
| `GET /api/v1/health/`                               | **BLOCKED** | Timeout from QA network (curl + PowerShell, 30s) |
| `POST /api/v1/auth/login/` (invalid creds)          | **BLOCKED** | Same timeout                                     |
| Authenticated `/me`, files, printing, notifications | **MANUAL**  | Requires live backend + test credentials         |

### Workstream 2 — Agent Expo Smoke

| Check               | Result     | Notes                                                                |
| ------------------- | ---------- | -------------------------------------------------------------------- |
| Metro bundler start | **PASS**   | `npx expo start --port 8085` — Metro started without bundle errors   |
| Cold boot UI        | **MANUAL** | Requires Android device/emulator + Expo Go or dev client             |
| Onboarding gate     | **STATIC** | `PublicNavigator` reads `panorama_onboarding_seen_v1` before routing |
| Auth bootstrap      | **STATIC** | `RootNavigator` → `AuthBootstrapScreen` during `bootstrap()`         |

### Workstream 3 — Device Runtime QA (13 flows)

#### 3.1 Authentication

| Test                                | Result                                                                   |
| ----------------------------------- | ------------------------------------------------------------------------ |
| Login success                       | **MANUAL**                                                               |
| Login failure (Arabic, no raw JSON) | **STATIC** — `authSessionService` + `toSafeAuthErrorMessage`             |
| Token refresh after expiry          | **STATIC** — single-flight refresh in `authBridge.ts` + client retry     |
| Session persistence (app restart)   | **STATIC** — SecureStore via `authTokenStorage`                          |
| Logout clears session               | **STATIC** — `logoutSession` + `useSessionStateCleanup` resets 11 stores |

#### 3.2 Student Journey

| Test                   | Result                                              |
| ---------------------- | --------------------------------------------------- |
| Academic setup E2E     | **MANUAL**                                          |
| Verification upload    | **MANUAL**                                          |
| Verification status UI | **STATIC** — status cards + illustrations wired     |
| `normal_user` path     | **STATIC** — `NormalUserIntroCard` + journey guards |

#### 3.3 Onboarding

| Test                                 | Result                                                                  |
| ------------------------------------ | ----------------------------------------------------------------------- |
| New user sees onboarding once        | **STATIC** — `hasSeenOnboarding()` + `markOnboardingSeen()`             |
| Returning user skips onboarding      | **MANUAL**                                                              |
| Logged-in user never sees onboarding | **STATIC** — `RootNavigator` routes to app/setup, not `PublicNavigator` |

#### 3.4 Network & Storage

| Test                              | Result                                                                  |
| --------------------------------- | ----------------------------------------------------------------------- |
| Offline / timeout handling        | **STATIC** — `NETWORK_ERROR` / `TIMEOUT` Arabic messages in `errors.ts` |
| Invalid token recovery            | **STATIC** — 401 → refresh → retry or `forceSessionExpired`             |
| Cross-user data leak after logout | **STATIC** — store resets on `status !== 'authenticated'`               |

#### 3.5 Files (HIGH)

| Test                           | Result                                                                                       |
| ------------------------------ | -------------------------------------------------------------------------------------------- |
| Image preview loading spinner  | **STATIC** — `InAppFileViewer` `ActivityIndicator`                                           |
| Protected files — no URL in UI | **STATIC** — `FileDetailsScreen` shows metadata only; URI used internally with Bearer header |
| Preview error state            | **STATIC** — `FileViewerFallback` + `file-preview-error.png`                                 |
| Large file handling            | **MANUAL**                                                                                   |

#### 3.6 Printing

| Test                   | Result                                                              |
| ---------------------- | ------------------------------------------------------------------- |
| Order creation         | **MANUAL**                                                          |
| Status transitions UI  | **STATIC** — status icons + `actionMessage` presentation            |
| Arabic status messages | **STATIC**                                                          |
| Timeline fields        | **STATIC** — `PrintOrderDetailsScreen` surfaces optional timestamps |

#### 3.7 Notifications

| Test                      | Result                                                        |
| ------------------------- | ------------------------------------------------------------- |
| List load                 | **MANUAL**                                                    |
| Read/unread + mark-all    | **STATIC** — store actions present                            |
| Tap navigation / fallback | **STATIC** — `resolveNotificationRouteIntent` + safe messages |
| Relative dates            | **STATIC** — `formatRelativeDateAr`                           |

#### 3.8 Chat / Groups

| Test                  | Result                                                                      |
| --------------------- | --------------------------------------------------------------------------- |
| Message send          | **MANUAL**                                                                  |
| Send failure + resend | **STATIC** — `sendErrorMessage` in chat store + input UI                    |
| Group list + search   | **STATIC**                                                                  |
| WS reconnect          | **STATIC** — max 3 attempts; **no token refresh on reconnect** (known risk) |

#### 3.9 Role-Based Access (CRITICAL)

| Role                                 | Result                                                           |
| ------------------------------------ | ---------------------------------------------------------------- |
| `student`                            | **STATIC** — journey routing via `useStudentAccessGate`          |
| `normal_user`                        | **STATIC**                                                       |
| `admin`, `it_support`, `print_staff` | **STATIC** — `shouldDenyMobileAccess` → `RoleAccessDeniedScreen` |
| Navigation bypass                    | **MANUAL**                                                       |

#### 3.10 Self-Service Auth Flag

| State         | Result                                                                              |
| ------------- | ----------------------------------------------------------------------------------- |
| OFF (default) | **STATIC** — `UnavailableAuthFlowScreen` on Register/Forgot; contact-admin on Login |
| ON            | **MANUAL** — requires `EXPO_PUBLIC_ENABLE_SELF_SERVICE_AUTH=true` + live backend QA |

#### 3.11 Performance

| Check               | Result                                                        |
| ------------------- | ------------------------------------------------------------- |
| Cold start          | **MANUAL**                                                    |
| FlatList screens    | **STATIC** — lists use FlatList in files/notifications/groups |
| Image-heavy screens | **MANUAL**                                                    |

### Workstream 4 — EAS / Build Readiness

| Item                  | Result            | Notes                                                                                 |
| --------------------- | ----------------- | ------------------------------------------------------------------------------------- |
| `app.config.ts` valid | **PASS**          | Icon, adaptiveIcon, favicon, cleartext plugin                                         |
| Native splash         | **DEFERRED**      | `ExpoConfig` SDK 56 has no `splash` field; asset at `src/assets/app/splash.png` ready |
| Android package       | **PASS**          | `com.panorama.student`, `versionCode: 1`                                              |
| iOS bundle ID         | **PASS**          | `com.panorama.student` (build deferred)                                               |
| `eas.json` profiles   | **PASS**          | development (dev client APK), preview (internal APK), production (AAB)                |
| EAS env secrets       | **ACTION NEEDED** | Profiles only set `EXPO_PUBLIC_APP_ENV`; must inject API/WS URLs per build            |
| Production build      | **BLOCKED**       | HTTPS/WSS required; `assertClientEnvForRelease()` will throw with HTTP defaults       |
| Preview build         | **READY**         | Safe to run `eas build --profile preview` after setting EAS env secrets               |

**EAS preview secret checklist:**

```env
EXPO_PUBLIC_APP_ENV=preview
EXPO_PUBLIC_API_BASE_URL=http://eby52x8qksscjvfeqxf0eob7.76.13.155.172.sslip.io
EXPO_PUBLIC_WS_BASE_URL=ws://eby52x8qksscjvfeqxf0eob7.76.13.155.172.sslip.io
EXPO_PUBLIC_ENABLE_SELF_SERVICE_AUTH=false
EXPO_PUBLIC_DASHBOARD_URL=http://zu642712hpki80yovl075v7z.76.13.155.172.sslip.io
```

### Workstream 5 — Error Handling Audit

| Check                          | Result                                                                   |
| ------------------------------ | ------------------------------------------------------------------------ |
| Arabic default error messages  | **PASS** — `src/api/errors.ts`                                           |
| No raw backend JSON in screens | **PASS** — no `JSON.stringify` of API responses in feature screens       |
| `request_id` in logs only      | **PASS** — logged in `client.ts`; not shown in user UI                   |
| Fallback UI on all modules     | **STATIC** — EmptyState / ErrorState / LoadingState wired per Phase 2B/3 |

---

## 2. Bug Fix List

**No runtime bugs fixed in Phase 4.** Static and smoke tests did not surface crashes, navigation breaks, or auth failures requiring code changes.

| Change                  | Type          | Notes                                                                                         |
| ----------------------- | ------------- | --------------------------------------------------------------------------------------------- |
| `app.config.ts` comment | Documentation | Clarified native splash deferral after SDK 56 `ExpoConfig` audit (splash block causes TS2353) |

---

## 3. Risk Assessment

| Risk                                    | Severity              | Mitigation                                                                        |
| --------------------------------------- | --------------------- | --------------------------------------------------------------------------------- |
| **HTTP-only backend**                   | **P0 for production** | Configure HTTPS API + WSS before production EAS profile; update EAS secrets       |
| **Backend unreachable during agent QA** | **High**              | Re-run backend smoke + full device QA when VPS is online                          |
| **Manual device QA incomplete**         | **High**              | Complete checklist below before preview APK distribution                          |
| **Self-service auth untested**          | **Medium**            | Keep `EXPO_PUBLIC_ENABLE_SELF_SERVICE_AUTH=false` until live OTP/reset validation |
| **WebSocket token refresh**             | **Medium**            | Long chat sessions may fail after access token expiry; user must re-enter room    |
| **Native splash not wired**             | **Low**               | Asset ready; add `expo-splash-screen` plugin when SDK supports config field       |
| **Prettier format drift (52 files)**    | **Low**               | Run `npm run format` before release branch merge (cosmetic)                       |
| **Global Search tab placeholder**       | **Low**               | Out of scope; tab exists but screen is placeholder                                |
| **PDF in-app viewer**                   | **Low**               | Fallback message shown; advanced PDF viewer deferred                              |

---

## 4. Build Status

| Target                             | Status           | Notes                                                                      |
| ---------------------------------- | ---------------- | -------------------------------------------------------------------------- |
| **Android preview (internal APK)** | **CONFIG-READY** | Run `eas build --platform android --profile preview` after EAS env secrets |
| **Android production (AAB)**       | **BLOCKED**      | Requires HTTPS/WSS + completed device QA                                   |
| **iOS**                            | **DEFERRED**     | Bundle ID configured; no iOS build executed                                |
| **EAS CLI**                        | **READY**        | `eas.json` valid; `cli.version >= 10.0.0`                                  |

---

## 5. Final Verdict

### NEEDS MINOR FIXES

The app is **not** production-store ready. It **is** structurally ready for an **internal preview APK** once:

1. Backend is reachable from test devices
2. EAS preview env secrets are configured
3. Manual device QA checklist (below) is completed with pass results
4. HTTPS/WSS URLs are provisioned before any production build

**Blocking production criteria (per Phase 4 spec):**

| Criterion                           | Status                          |
| ----------------------------------- | ------------------------------- |
| Login/logout/session on real device | **MANUAL — pending**            |
| Onboarding stable                   | **STATIC pass; device pending** |
| Student journey stable              | **MANUAL — pending**            |
| File preview works                  | **MANUAL — pending**            |
| Printing works                      | **MANUAL — pending**            |
| Notifications work                  | **MANUAL — pending**            |
| No runtime crashes                  | **MANUAL — pending**            |

---

## Appendix A — Manual Device QA Checklist (for QA engineer)

Complete on **Android physical device or emulator** with backend online. Mark each **PASS** / **FAIL** / **SKIP**.

### Setup

```bash
# Local dev
cp .env.example .env
npm start
# Scan QR with Expo Go or dev client

# Or install preview APK from EAS after build
```

### Authentication

- [ ] Login with valid student credentials → correct root flow (setup or home)
- [ ] Login with invalid credentials → Arabic error, no JSON blob
- [ ] Kill app → reopen → session restored (no re-login)
- [ ] Logout → login screen → no stale data in lists
- [ ] (Optional) Wait for token expiry or force 401 → silent refresh or session-expired message

### Student Journey

- [ ] New student: academic profile setup completes
- [ ] Verification: pick image → submit → pending status
- [ ] Approved/rejected status reflects backend
- [ ] `normal_user`: intro card → academic setup

### Onboarding

- [ ] Fresh install (clear app data): onboarding → login
- [ ] Second launch (logged out): skip onboarding
- [ ] Logged-in: never see onboarding

### Files

- [ ] Open image file → spinner → preview
- [ ] Broken/missing file → error illustration + Arabic message
- [ ] No raw URL visible in UI

### Printing

- [ ] Create print order from file
- [ ] Order list shows correct status + Arabic action message
- [ ] Detail screen shows timeline fields when backend provides them

### Notifications

- [ ] List loads (empty + populated)
- [ ] Mark read / mark all read
- [ ] Tap notification → navigates or shows fallback message

### Chat / Groups

- [ ] Send message in group chat
- [ ] Simulate send failure → inline error + resend
- [ ] Group search + empty state

### Roles

- [ ] `student` / `normal_user` → appropriate flows
- [ ] `admin` / `it_support` / `print_staff` → `RoleAccessDeniedScreen` + logout

### Self-Service Auth (two sessions)

**Session A — flag OFF (default):**

- [ ] Login shows contact-admin card
- [ ] Register/Forgot routes show unavailable screen

**Session B — flag ON:**

- [ ] Set `EXPO_PUBLIC_ENABLE_SELF_SERVICE_AUTH=true`, rebuild
- [ ] Register → OTP → Login
- [ ] Forgot → Reset → Login

### Performance (observe)

- [ ] Cold start < 5s acceptable on target device
- [ ] Scroll files/notifications/groups without jank
- [ ] No crash on image-heavy screens

---

## Appendix B — Commands Reference

```bash
npm run validate          # typecheck + lint + format + expo config
npm run typecheck
npm run lint
npm run expo:config
npm run build:preview     # eas build --platform android --profile preview
```

---

## Phase 4 Completion Criteria

| Criterion                   | Met?                                           |
| --------------------------- | ---------------------------------------------- |
| Static/tooling validation   | **Yes** (except Prettier drift)                |
| EAS config audit            | **Yes**                                        |
| Backend smoke from QA env   | **No** — backend timeout                       |
| Expo Metro smoke            | **Yes**                                        |
| Full on-device QA           | **No** — requires QA engineer + online backend |
| Blocking bugs fixed         | **N/A** — none found                           |
| Production readiness report | **Yes** — this document                        |

**Phase 4 documentation is complete.** Re-open verdict to **READY FOR PRODUCTION** only after manual checklist passes, HTTPS/WSS configured, and preview APK validated on device.
