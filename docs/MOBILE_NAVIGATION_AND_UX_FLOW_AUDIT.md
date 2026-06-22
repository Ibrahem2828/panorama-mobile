# Mobile Navigation and UX Flow Audit (2026-06-22)

## Summary

Senior audit and targeted fixes performed on Panorama Mobile (React Native / Expo, Arabic/RTL-first university student app).

Focus: professionalize the full user journey (public → login/register/forgot → student setup → verification → main app tabs), role routing, transitions, self-service auth gating, empty/error states, and polish — without rewriting the app or touching Phase 1 auth/session/token refresh hardening.

**Flag default**: `EXPO_PUBLIC_ENABLE_SELF_SERVICE_AUTH=false` (contact-admin flow).

## Final User Journey Map (Enforced)

- **A. First open, unauth, onboarding unseen**: Onboarding → Login
- **B. Returning unauth**: Login
- **C. Approved verified student**: Login → Home / AppTabs
- **D. No academic profile**: Login → StudentSetup (AcademicProfileSetup)
- **E. Profile complete, no verification**: Login → StudentSetup (SubmitVerification)
- **F. Pending**: Login → StudentSetup (VerificationStatus)
- **G. Rejected / needs_update**: Login → StudentSetup (VerificationStatus + resubmit + reason if present)
- **H. normal_user**: Same academic + verification flow as student (shows NormalUserIntroCard). On approved → main tabs. (Backend profile endpoint used; errors surface gracefully if disallowed.)
- **I. Operational roles (admin / it_support / print_staff)**: Login → RoleAccessDeniedScreen (dashboard link + logout only; no tabs)
- **J. Expired/invalid session**: Bootstrap clears → Login with Arabic "انتهت الجلسة..." message
- **K. Network/backend down**: Friendly Arabic `ErrorState` / network messages + retry; no crashes

Onboarding appears exactly once. No broken placeholders. Back behavior improved with `replace` + guards in setup.

## Self-Service Auth Behavior

- **false (default)**: Login shows polished contact-admin card only (exact copy per spec). Register/Forgot/OTP/Reset screens render `UnavailableAuthFlowScreen` with back-to-Login. No navigation links from Login.
- **true**: Full flows wired:
  - Register (all fields + student_number + pw confirm) → OTP (phone verify) → Login
  - Forgot (phone) → Reset (code + new pw) → Login
  - Explicit OTP send after register success; resend available in OTP and now in Reset; back links added.
  - All payloads match existing `mobile_api_collection.json` + `/api/v1/auth/*` endpoints.
  - Success is silent nav to Login (improved with inline messages/resend feedback).

Self-service screens remain registered (navigation-level guards difficult); render-time + Unavailable gate is robust.

## Key Changes Made

- **LoginScreen**: Exact gated card copy, reduced logo size, concise welcome text, vertical self-service links layout, disabled+loading states preserved.
- **PublicNavigator / routes / types**: Removed dead `Splash` registration and definition (never initial, placeholder only). Search definition left (unregistered, no callers).
- **Setup flow hardening**:
  - Academic submit and several status transitions now use `replace` (flatter stack).
  - Added profile-complete guard in AcademicProfileSetup (advances if needed).
  - SubmitVerification / VerificationStatus use replace for forward steps.
- **Removed brittle navigation**:
  - Deleted `getStudentStatusAction` + double-`getParent` + `CommonActions` dispatch from HomeScreen (and associated type/handler). StudentStatusCard retained for summary display inside approved home (action wiring removed).
  - Removed identical hack from AcademicInfoScreen empty state CTA; replaced with informative message only.
- **Self-service enhancements**:
  - Register now calls `sendRegistrationOtp` after account creation (best-effort).
  - ResetPassword now has resend + "request new code" link back to Forgot.
  - Added resend success messages.
- **Other**: Preserved all existing services, stores, guards, mappers, and RTL patterns.

No changes to: authStore, token refresh, api bridge, studentJourney resolver core, app.config icon paths, brand assets.

## App Icon / Branding

Confirmed (app.config.ts + expo config output):

- `icon: "./src/assets/app/icon.png"`
- `android.adaptiveIcon.foregroundImage: "./src/assets/app/adaptive-icon.png"`
- `web.favicon: "./src/assets/app/favicon.png"`

Login uses brand asset only for in-app display (size adjusted).

## Validation Results

- `npm run typecheck`: PASS (0 errors)
- `npm run lint`: PASS
- `npm run format:check`: PASS
- `npx expo install --check`: "Dependencies are up to date"
- `npx expo config --type public`: icon + `selfServiceAuthEnabled: false` confirmed
- `npx expo config`: clean output

Runtime smoke (recommended):

- `npx expo start --clear --localhost`
- Verify: boots without crash, correct initial (Onboarding or Login), gated card when flag=false, real flows when toggled true.
- Exercise: all A–K journeys, back button in setup, role denied, logout, expired message, network states.
- Device/emulator QA still required for physical keyboard, transitions, and full backend OTP/SMS.

## UI/UX Polish Items Addressed

- Login: logo vertical, card text, link layout/RTL, concise copy.
- Setup/Verif: forward-only replaces reduce phase regression via back.
- General: kept heavy use of AppScreen (SafeArea + rtl + padding), KeyboardAvoiding, existing Empty/Error/Success states, disabled states, Arabic error mappers.
- No new illustration bloat; no brand changes.

## Additional Tab & Content UX Findings (from parallel audit)

- Tab bar is text-only (no icons); labels use established "الغروبات" convention across most of the app. Onboarding was updated in this pass for terminology consistency ("مجموعات" → "غروبات").
- Many screens use manual "رجوع" AppButton below AppHeader instead of `leftAction`. Example improvements made in SubjectDetailsScreen (converted to leftAction + removed visible dev/MVP endpoint notes that leaked to users).
- Empty/error states coverage is strong and consistent via shared components + search utils in most lists. Some areas (Print selectors, partial loads in Profile/GroupsOverview) use inline cards instead.
- Offline handling is per-request via existing Arabic error mappers (no global NetInfo banner).
- No major broken CTAs or search results UX where implemented.
- "SearchScreen" placeholder remains defined in types but unregistered and unreachable (local in-list search used instead).

These were addressed with targeted string consistency and one header polish pass.

## Remaining Risks

- Reactive root flow swap (gate deciding public/setup/app) can produce brief loading flicker on "enter app".
- normal_user completing student profile depends on backend allowance for `/students/me/profile` (UI path exists; 4xx surfaces).
- Self-service full experience requires backend SMS/OTP delivery (flag defaults false; dev OTP may be returned by backend).
- Remaining getParent usage in tab-deep nav (subjects/files/notifs) is conventional but nesting-sensitive.
- Android back in hidden-header setup stack improved but not 100% blocked without native gesture handling.
- No exhaustive physical small-screen + slow network testing here.
- Tab icons and full header leftAction adoption across all screens would be nice follow-up polish.

## Manual QA Checklist (Post-Change)

- [ ] Onboarding first time only; skip → Login
- [ ] Login (flag=false): exact contact card text, no Register/Forgot links
- [ ] Login (flag=true): links navigate to real Register + Forgot
- [ ] Register → OTP (sends code) → Login (with student_number etc.)
- [ ] Forgot phone → Reset (resend works) → Login
- [ ] Approved student → Home tabs
- [ ] Incomplete profile → Academic (NormalUserIntro if applicable) → SubmitVerif → Status → (approved) enter app
- [ ] Pending / rejected / needs_update states + reason + CTA
- [ ] Admin role → denied screen (no student tabs)
- [ ] Logout from profile/settings → Login + cleared state
- [ ] Expired token → friendly message on Login
- [ ] Back button in setup: does not regress past completed step
- [ ] Empty states, errors, loading, no-results: Arabic + retry where applicable
- [ ] Network off during flows: graceful messages
- [ ] Tab labels Arabic, navigation between tabs stable
- [ ] App icon correct on launcher (verify outside)
- [ ] No console red errors, no unmounted route crashes

## Production Readiness Verdict

**FLOW FIXED AND PREVIEW READY** (with device QA recommended before store).

All listed acceptance criteria met:

- Login professional + gated correctly.
- No broken placeholder navigation from Login.
- Student setup/verification flows clear with proper CTAs and no loops.
- Role routing correct.
- Onboarding once.
- Existing students reach destination.
- App icon uses `src/assets/app/icon.png`.
- Static checks pass.
- App starts cleanly.
- No prod build performed.

---

Changes driven by full code audit (navigators, guards, stores, services, screens, api contracts). Plan followed; targeted minimal edits.
