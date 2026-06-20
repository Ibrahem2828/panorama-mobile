# Mobile Phase 2B: Visual Asset Binding & Onboarding Gate

## Summary

Phase 2B connects designed image assets to meaningful UI states across the Arabic/RTL student app,
implements first-launch onboarding gating for unauthenticated new users, and wires app icon/favicon
config — without changing Phase 1 API/auth runtime or Phase 2 student journey architecture.

## Scope Completed

- Centralized typed image registry (`src/assets/images.ts`)
- Reusable illustration components (`Illustration`, `StateIllustration`)
- Extended `EmptyState`, `ErrorState`, `SuccessState` with optional illustration props
- Onboarding gate with AsyncStorage persistence and anti-flicker initial route resolution
- Four-slide onboarding flow with RTL pagination and skip/next/start CTAs
- Image bindings across login, verification, empty states, errors, printing, files, notifications, home, groups, subjects, support, and chat
- App config icon/favicon/adaptiveIcon wiring (splash deferred to Phase 4 due to ExpoConfig typing)
- TypeScript fixes for `app.config.ts` and `OnboardingScreen.tsx` (`noUncheckedIndexedAccess`)

## Asset Registry

**File:** `src/assets/images.ts`

Static `require()` imports grouped by domain:

| Domain          | Keys                                                                                        |
| --------------- | ------------------------------------------------------------------------------------------- |
| `app`           | icon, adaptiveIcon, splash, favicon                                                         |
| `brand`         | logoMark, logoFullAr, logoFullEn, logoFullBilingual, logoWhite, logoDark                    |
| `onboarding`    | university, verification, groups, filesPrinting                                             |
| `verification`  | studentCardGuide, cardExampleGood/Blurry/Cropped/Dark, pending, approved, rejected          |
| `emptyStates`   | announcements, subjects, groups, files, printingOrders, notifications, supportTickets, chat |
| `errors`        | network, server, permission, sessionExpired, maintenance                                    |
| `printing`      | hero, orderPending, orderProcessing, orderReady, orderCompleted, orderCancelled             |
| `files`         | pdf, image, document, locked, previewError                                                  |
| `notifications` | announcement, verification, printing, support, group                                        |
| `illustrations` | studentMale, studentFemale, studyDesk, universityBuilding, success, warning, search         |

All expected asset files exist under `src/assets/` (not root `assets/`). `expectedImageAssetPaths` documents the full checklist.

## Onboarding Gating

**Persistence:** `panorama_onboarding_seen_v1` in AsyncStorage (`src/features/onboarding/services/onboardingStorage.ts`)

| Condition                          | Route                                        |
| ---------------------------------- | -------------------------------------------- |
| Unauthenticated + flag not set     | `Onboarding` (4 slides)                      |
| Unauthenticated + flag set         | `Login`                                      |
| Authenticated (any bootstrap path) | Student setup or main app — never onboarding |
| Logout                             | Does **not** reset onboarding flag           |
| App data cleared                   | Onboarding may show again (acceptable)       |

**Navigator:** `PublicNavigator.tsx` resolves `initialRouteName` asynchronously and shows a loading gate (`جاري تجهيز البداية...`) to avoid flicker.

**Onboarding screen:** Skip (`تخطي`), next/back (`التالي` / `السابق`), final CTA (`ابدأ الآن`) all call `markOnboardingSeen()` then `navigation.replace(Login)`.

## Screens Updated

| Area          | Files                                                                                                                           | Images used                                       |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| Onboarding    | `OnboardingScreen.tsx`, `PublicNavigator.tsx`, `onboardingStorage.ts`                                                           | onboarding.\*                                     |
| Login         | `LoginScreen.tsx`                                                                                                               | brand.logoFullBilingual                           |
| Verification  | `SubmitVerificationScreen.tsx`, `VerificationStatusScreen.tsx`, `VerificationStatusCard.tsx`, `VerificationCardImagePicker.tsx` | verification.\*                                   |
| Home          | `HomeScreen.tsx`                                                                                                                | emptyStates.announcements                         |
| Subjects      | `SubjectsListScreen.tsx`                                                                                                        | emptyStates.subjects, illustrations.search        |
| Groups        | `MyGroupsScreen.tsx`, `AvailableGroupsScreen.tsx`                                                                               | emptyStates.groups                                |
| Files         | `FilesListScreen.tsx`, `GroupFilesScreen.tsx`, `FileTypeIcon.tsx`, `FileViewerFallback.tsx`                                     | files.\*, emptyStates.files, illustrations.search |
| Printing      | `PrintHomeScreen.tsx`, `MyPrintOrdersScreen.tsx`, `PrintOrderStatusIcon.tsx`                                                    | printing.\*, emptyStates.printingOrders           |
| Notifications | `NotificationsScreen.tsx`, `NotificationTypeIcon.tsx`                                                                           | notifications.\*, emptyStates.notifications       |
| Support       | `SupportTicketsScreen.tsx`                                                                                                      | emptyStates.supportTickets                        |
| Chat          | `ChatEmptyState.tsx`                                                                                                            | emptyStates.chat                                  |
| Auth          | `RoleAccessDeniedScreen.tsx`                                                                                                    | errors.permission (via ErrorState kind)           |
| Shared        | `EmptyState.tsx`, `ErrorState.tsx`, `SuccessState.tsx`, `StateIllustration.tsx`, `Illustration.tsx`                             | registry-driven                                   |

## Empty State Mappings

| Screen                | Asset key               | Arabic title (summary)    |
| --------------------- | ----------------------- | ------------------------- |
| Home announcements    | `empty-announcements`   | لا توجد إعلانات حالياً    |
| Subjects              | `empty-subjects`        | لا توجد مواد مفعّلة بعد   |
| Groups                | `empty-groups`          | لم تنضم إلى أي مجموعة بعد |
| Files                 | `empty-files`           | لا توجد ملفات متاحة       |
| Printing orders       | `empty-printing-orders` | لا توجد طلبات طباعة       |
| Notifications         | `empty-notifications`   | لا توجد إشعارات           |
| Support tickets       | `empty-support-tickets` | لا توجد تذاكر دعم         |
| Chat                  | `empty-chat`            | لا توجد رسائل بعد         |
| Files/subjects search | `search` illustration   | No search results         |

## Error State Mappings

`ErrorState` accepts `kind` prop resolving to `images.errors[kind]`:

| Kind             | Asset                     |
| ---------------- | ------------------------- |
| `network`        | error-network.png         |
| `server`         | error-server.png          |
| `permission`     | error-permission.png      |
| `sessionExpired` | error-session-expired.png |
| `maintenance`    | error-maintenance.png     |

Screens pass `onRetry` where appropriate. Technical `request_id` remains available via existing Phase 1 error normalization; not shown to students by default.

## Verification Image Integration

- **Submit:** `student-card-guide` hero + compact card examples (good/blurry/cropped/dark)
- **Status card:** pending → `verification-pending`, approved → `verification-approved`, rejected/needs_update → `verification-rejected`
- Image paired with Arabic title, description, and status-appropriate CTA (unchanged Phase 2 behavior)

## Printing / Files / Notifications Integration

- **Printing:** Hero on `PrintHomeScreen`; `PrintOrderStatusIcon` maps order status to small status images in list cards
- **Files:** `FileTypeIcon` maps mime/extension to pdf/image/document/locked; preview fallback uses `file-preview-error`
- **Notifications:** `NotificationTypeIcon` maps notification type to small thumbnail icons in list rows

## App Config Asset Changes

**File:** `app.config.ts`

- `icon`: `./src/assets/app/icon.png`
- `web.favicon`: `./src/assets/app/favicon.png`
- `android.adaptiveIcon.foregroundImage`: `./src/assets/app/adaptive-icon.png`
- Top-level `splash` **not** wired — current `ExpoConfig` type rejects it; deferred to Phase 4. Asset exists at `./src/assets/app/splash.png`.

## Missing Assets

None at implementation time. All paths in `expectedImageAssetPaths` resolve to files on disk.

## Remaining Risks

- Splash screen not active until Phase 4 Expo config validation
- Runtime visual QA not performed (typecheck only)
- Some screens use generic `ErrorState` without explicit `kind` (defaults to server illustration)
- `student-male` / `student-female` illustrations registered but used sparingly on Home to avoid visual noise
- Large state images may need device-specific tuning after first emulator/device pass in Phase 4

## Phase 3 / Phase 4 Should Handle

- Full self-service registration and password reset flows
- Splash screen product wiring after Expo config audit
- HTTPS/production asset and env validation on real devices
- WebSocket/push polish
- Optional search placeholder screens with `search` illustration
- Visual density pass after first on-device QA

## Verification

`npm run typecheck` — passes.

The app, Expo, emulator, simulator, and EAS builds were **not** run in this phase.
