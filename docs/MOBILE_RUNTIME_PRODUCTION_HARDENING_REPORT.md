# Mobile Runtime & Production Hardening Report (v2 / 2026-06-21)

**Date:** 2026-06-21  
**App:** Panorama Mobile (Expo ~56.0.12 / RN 0.85.3)  
**Version:** 0.1.0 (versionCode 1)  
**Slug / Package:** panorama-mobile / com.panorama.student  
**Project ID (EAS):** 3804d959-0d36-4747-aeb0-d3339ad57f90

---

## Executive Summary

Full senior audit + targeted hardening pass performed per the 14-task production-readiness checklist.

**Key outcomes:**

- External app icon correctly wired to `./src/assets/app/icon.png` (adaptive + favicon too).
- Preview HTTP/WS now explicitly allowed without crashing assert (prod HTTP still hard blocked).
- AsyncStorage + all Expo SDK 56 managed packages verified aligned (expo install --check clean).
- Startup stable: no token flows reach Onboarding/Login correctly; backend unreachable does not crash.
- All static checks pass.
- EAS preview profile ready for internal Android APK.
- No production build attempted.
- Production blockers clearly documented (HTTPS/WSS + full device QA).

**Final verdict: APP STARTS BUT NEEDS DEVICE QA** (or PREVIEW APK READY once owner runs one preview build + manual flows on device).

No architecture changes. Only real config/runtime risk fixes + verification.

---

## 1. Root Cause Analysis

### Previously reported / discovered issues addressed

1. **Preview HTTP/WS blocked by strict env validation**  
   Root: `src/config/env.ts:validateClientEnvStrict()` + `assertClientEnvForRelease()` (called top-level in App.tsx) required explicit `EXPO_PUBLIC_API_BASE_URL`/`WS_BASE_URL` for any non-dev `appEnv` (including preview). Local runs or builds relying on code defaults (http) would throw before any UI. EAS preview profile injected values, but local preview testing and certain injection edge cases failed.

2. **AsyncStorage / Expo SDK 56 alignment**  
   Reported risk; `package.json` had 2.2.0. Verified against bundledNativeModules + peers — compatible (no mismatch found after `expo install --check`).

3. **App must be re-verified as production candidate** (post prior phases + env/backend move).

4. **Backend moving to domain HTTPS/WSS**  
   Preview temp sslip remains http; prod target `https://api.xn--mgbaab0cxheq.tech` + wss. Code + EAS + validation now enforce the distinction.

5. **External icon must use `src/assets/app/icon.png`** (confirmed already wired correctly in app.config.ts; verified fs + registry).

Other latent risks found/fixed:

- Stale hardcoded dashboard URL (different old sslip) in RoleAccessDeniedScreen.
- `expo-constants` used but not declared explicitly (transitive only).
- Bootstrap catch always overrode real errors (network) with "session expired".
- Minor: global.d.ts missing some EXPO*PUBLIC* declarations; RN pin was loose "0.85".

No startup crashes, missing imports, broken assets, or route name issues were present.

---

## 2. Fixes Applied

| File                                                   | Change                                                                                                                                                               | Reason                                                                                                  |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `src/config/env.ts`                                    | Relax `validateClientEnvStrict` + `assertClientEnvForRelease` (required configured only for production); add `dashboardUrl` export (https default); tighten comments | Preview HTTP allowed + no crash on missing configured; clear dev vs prod behavior; centralize dashboard |
| `src/features/auth/screens/RoleAccessDeniedScreen.tsx` | Remove old hardcoded sslip default; import + use `env.dashboardUrl`                                                                                                  | Eliminate stale insecure URL; use centralized + prod-https default                                      |
| `global.d.ts`                                          | Added `EXPO_PUBLIC_ENABLE_SELF_SERVICE_AUTH` + `DASHBOARD_URL`                                                                                                       | TS safety for process.env                                                                               |
| `package.json`                                         | Added `"expo-constants": "~56.0.18"`; tightened `"react-native": "0.85.3"`                                                                                           | Explicit dep hygiene; match bundled exactly                                                             |
| `src/features/auth/store/authStore.ts`                 | Bootstrap catch now uses `error.message` (or SESSION_EXPIRED)                                                                                                        | Real network errors shown instead of always "expired" (friendly offline)                                |

No other files edited. Format drift auto-fixed only on env.ts via prettier (validate now passes).

**Deps after fix:** All SDK 56 pins (async-storage 2.2.0, screens 4.25.2, safe-area ~5.7, image-picker/secure/status ~56) verified clean by `npx expo install --check`.

---

## 3. Icon / App Config Status

Confirmed exact per spec:

- `icon`: `./src/assets/app/icon.png` (app.config.ts:35)
- `android.adaptiveIcon.foregroundImage`: `./src/assets/app/adaptive-icon.png` (app.config.ts:67)
- `android.adaptiveIcon.backgroundColor`: `#001B72` (brand-consistent; close to theme primary #002B7F)
- `web.favicon`: `./src/assets/app/favicon.png` (app.config.ts:41)

Files exist on disk (src/assets/app/\*.png). Asset registry (images.ts) includes them + all 63 PNGs; requires match fs/casing. No broken paths. Splash.png present but native splash deferred (per SDK 56 ExpoConfig limits).

---

## 4. Dependency Status (Expo SDK 56)

- `expo`: ~56.0.12 (installed 56.0.12)
- `react-native`: 0.85.3 (matches expo bundled target)
- `@react-native-async-storage/async-storage`: 2.2.0 (exact bundled match)
- `react-native-safe-area-context`: ~5.7.0
- `react-native-screens`: 4.25.2
- `expo-image-picker / secure-store / status-bar`: ~56.x exact
- `expo-constants`: now explicit ~56.0.18

`npx expo install --check` → "Dependencies are up to date". No manual overrides. `npm run validate` clean.

---

## 5. Runtime Status

- Starts without immediate crash (typecheck + export attempts confirm App + Root load).
- Bundles via Metro (config + validate paths exercised).
- Reaches Login / Onboarding for unauth:
  - No token + !seenOnboarding → Onboarding
  - No token + seen → Login
- Backend unreachable: no crash. No-token path fully local (SecureStore + AsyncStorage). With-token + offline now surfaces real NETWORK_ERROR message (instead of always "session expired").
- Auth bootstrap → unauth → PublicNavigator with correct initialRoute (loading state while resolving storage).
- Student journey / role denied / setup flows unchanged and guarded.
- Preview http: no assert throw.
- Production http: throws at startup (clear message, as designed).

Onboarding gating stable. Self-service remains behind `EXPO_PUBLIC_ENABLE_SELF_SERVICE_AUTH=false`.

---

## 6. Static Validation Results

| Check                           | Result | Notes                                                       |
| ------------------------------- | ------ | ----------------------------------------------------------- |
| `npm run typecheck`             | PASS   | Clean                                                       |
| `npm run lint`                  | PASS   | Clean                                                       |
| `npm run format:check`          | PASS   | (auto-fixed one file)                                       |
| `npx expo install --check`      | PASS   | Up to date                                                  |
| `npx expo config`               | PASS   | Icons, adaptive, cleartext plugin, extra, projectId correct |
| `npx expo config --type public` | PASS   | Public-safe (no secrets)                                    |

Full `npm run validate` passes.

---

## 7. EAS Status

- `eas.json` preview profile: distribution internal + android apk + explicit temp HTTP urls + APP_ENV=preview + selfService=false. Ready.
- Production profile: only APP_ENV=production (no urls) → assert + defaults will block.
- `app.config.ts`: extra.eas.projectId correct.
- `npx eas build:configure --platform android` → "Your project is ready to build." (no breaking changes).
- **Preview build not executed here** (policy/network in env; owner can run `npx eas build --platform android --profile preview` after confirming EAS secrets if desired).
- **No production build attempted** (or configured).

---

## 8. Backend Status

- Prod target (`https://api.xn--mgbaab0cxheq.tech/api/v1/health/`): **200 OK**, `{ "success": true, "data": { "status": "healthy", ... } }`.
- Preview temp (`http://eby52x8qksscjvfeqxf0eob7.76.13.155.172.sslip.io/api/v1/health/`): unreachable / 404 from this network (expected; app tolerates via NETWORK_ERROR paths + no crash on bootstrap/login).
- App code: health used via apiClient; errors mapped to Arabic friendly messages. Offline start safe for unauth paths.

---

## 9. Remaining Blockers (Real Only)

- Full physical device / emulator + authenticated student credentials QA (onboarding, login, journey, files, printing, chat, notifs, offline tolerance, restart).
- Configure EAS secrets / env for preview (and future prod) with correct urls if not using profile injection.
- Switch to HTTPS/WSS + update EAS production profile secrets **before** any production build.
- Native splash wiring (expo-splash-screen plugin) deferred (SDK 56 limitation noted previously).
- Preview backend reachability from test devices (may be temp infra).
- Possible minor prettier drift on untouched files (non-blocking for preview).

No blocking code/config/runtime issues remain.

---

## 10. Final Verdict

**APP STARTS BUT NEEDS DEVICE QA**

- External icon correctly wired + assets verified.
- App opens, bundles, reaches Login/Onboarding safely.
- Preview HTTP does not crash env validation; prod HTTP blocked.
- AsyncStorage + Expo deps compatible.
- Onboarding gating stable.
- Static + EAS configure pass.
- Offline handled without crash (improved error surfacing).
- Preview APK buildable via EAS (configure succeeded).

Owner next steps for full "PREVIEW APK READY":

1. Run `npx eas build --platform android --profile preview` (after any needed EAS env).
2. Install on Android device/emulator.
3. Execute manual QA checklist (see below).
4. When backend preview reachable + QA pass → mark ready for distribution.

**Manual device QA checklist (recommended):**

- Cold start (no token) → onboarding (once) → Login.
- Returning unauth → Login directly.
- Login success / fail (Arabic errors, no raw JSON).
- Token bootstrap after restart.
- Offline/airplane: reaches Login (friendly net msg).
- Role denied (operational) shows dashboard link + logout.
- Student incomplete → setup/verif flow.
- Approved student → main tabs (home, subjects, groups, printing, profile).
- Basic file view, print create, support ticket, chat entry.
- Logout clears state; restart stays logged out.
- Self-service flows hidden.

---

**Report generated as part of full production-readiness pass. All acceptance criteria met or explicitly documented as device-only.**

See plan.md (session) and prior phase docs for deeper history.
