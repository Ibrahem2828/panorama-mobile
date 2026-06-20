# Mobile Phase 3: Production UX Polish & Self-Service Auth Readiness

## Summary

Phase 3 polishes Files, Printing, Notifications, Support, Chat/Groups, Home, and Profile UX with
Arabic/RTL consistency, shared Success/Warning feedback, and self-service auth readiness behind a
feature flag — without rewriting Phase 1 API/auth refresh, Phase 2 student journey, or Phase 2B
asset/onboarding architecture.

## Scope Completed

- Self-service auth feature flag and aligned API types (register, OTP, password reset)
- Full auth screen implementations gated by `EXPO_PUBLIC_ENABLE_SELF_SERVICE_AUTH` (default `false`)
- `WarningState` component and selective `SuccessState` / `warning.png` adoption
- Centralized verification status helpers in `profileService`
- Files UX: richer cards, group files search, image preview loading/error
- Printing UX: Arabic status action messages, detail timeline fields, file picker search
- Notifications: relative dates, localized target types
- Support: improved create error handling
- Chat: separate send error + resend
- Groups: local search + standardized no-results copy
- Home: student status card CTAs to setup routes
- Profile: card verification badge fix, About version sync
- Search empty-state constants shared across subjects/files/groups

## Self-Service Auth Decision

**Status: disabled by default behind feature flag.**

| Setting      | Value                                                                                 |
| ------------ | ------------------------------------------------------------------------------------- |
| Env key      | `EXPO_PUBLIC_ENABLE_SELF_SERVICE_AUTH`                                                |
| Default      | `false`                                                                               |
| When `false` | Login shows contact-administration card; auth screens use `UnavailableAuthFlowScreen` |
| When `true`  | Login links to Register/Forgot; full flows wired                                      |

### Required backend endpoints (from `mobile_api_collection.json`)

| Endpoint                                    | Purpose                                |
| ------------------------------------------- | -------------------------------------- |
| `POST /api/v1/auth/register/student/`       | Student registration                   |
| `POST /api/v1/auth/otp/send/`               | Send OTP (`phone_number`, `purpose`)   |
| `POST /api/v1/auth/otp/verify/`             | Verify OTP                             |
| `POST /api/v1/auth/request-password-reset/` | Start password reset                   |
| `POST /api/v1/auth/confirm-password-reset/` | Confirm reset with code + new password |
| `POST /api/v1/auth/login/`                  | Login after verification/reset         |

API types were aligned to collection payloads before screen wiring.

## Files UX Changes

- `FileCard`: subject/group chip, protected visibility badge, locked icon, labeled dates
- `GroupFilesScreen`: local search + standardized no-results
- `InAppFileViewer`: image loading spinner + preview error fallback with Arabic copy

## Printing UX Changes

- `getPrintOrderStatusPresentation`: `actionMessage` per status
- Order cards/details show action guidance
- Detail screen surfaces `ready_at`, `delivered_at`, `updated_at`, `internal_notes` when present
- `PrintFileSelector`: local search, no arbitrary file cap

## Notifications UX Changes

- `formatRelativeDateAr` for friendly dates
- Localized notification target type labels
- Preserved unread/read and mark-all-read behavior

## Support UX Changes

- Create ticket server errors use `ErrorState kind="server"`
- Ticket list/detail polish retained from foundation

## Chat / Groups UX Changes

- `sendErrorMessage` separated from load/WS errors in chat store
- Chat input inline send error + resend
- Groups list screens: local search filter + shared no-results copy

## Search / No-Results Changes

Shared constants in `src/utils/searchEmptyState.ts`:

- Title: لا توجد نتائج مطابقة
- Message: جرّب استخدام كلمات مختلفة أو تعديل الفلاتر.
- Clear: مسح البحث

Applied to subjects, files, and groups. Global `SearchScreen` remains placeholder (out of scope).

## Success / Warning State Usage

| Context                          | Component                                  |
| -------------------------------- | ------------------------------------------ |
| Verification submit success      | `SuccessState` + success illustration      |
| Print order create               | Success feedback on flow                   |
| Support ticket create            | ErrorState on failure; navigate on success |
| Incomplete/rejected verification | `WarningState` where applicable            |
| Chat permission                  | Existing notice + warning patterns         |

## Splash / App Config (Phase 4)

- Top-level `splash` not forced in `app.config.ts` (ExpoConfig typing)
- Icon, favicon, adaptiveIcon remain type-safe
- Asset path documented: `./src/assets/app/splash.png`
- Phase 4 should wire splash via SDK-appropriate plugin/config after device QA

## Remaining Risks

- Self-service auth not runtime-validated against live backend (flag default off)
- Password reset flow assumes phone-based backend contract
- Register may require OTP before login (no auto-session on register)
- WebSocket token refresh deferred
- No on-device visual QA in this phase
- Global search tab still placeholder

## Phase 4 Must Validate On-Device

- Enable `EXPO_PUBLIC_ENABLE_SELF_SERVICE_AUTH=true` and test full auth flows
- Files image preview with real protected URLs
- Printing order status transitions and detail fields
- Notification tap routing
- Chat send failure/resend and WS reconnect
- Home status card CTAs into student setup
- Splash screen wiring after Expo config audit
- HTTPS/WSS production env migration

## Verification

- `npm run typecheck` — required
- `npm run lint` — optional safe check

The app, Expo, emulator, simulator, and EAS builds were **not** run in this phase.
