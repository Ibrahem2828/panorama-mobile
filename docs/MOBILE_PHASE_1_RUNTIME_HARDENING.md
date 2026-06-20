# Mobile Phase 1 Runtime Hardening

## Summary

Phase 1 hardens the Panorama Mobile foundation for production readiness without expanding product
scope. The work focuses on API communication, automatic token refresh, error normalization,
environment safety, auth/session lifecycle, and student-only route guards.

## What Changed

- Added an auth bridge so the API layer can refresh tokens without importing Zustand or SecureStore.
- Added single-flight `401` refresh with one retry for protected API requests.
- Enriched API errors with Arabic user messages, optional technical messages, and `request_id`.
- Strengthened auth bootstrap and forced session-expiry handling.
- Fixed role guards so operational roles cannot enter the student app.
- Routed `normal_user` accounts into the student setup flow.
- Added a dedicated Arabic access-denied screen for admin/IT/print staff.
- Tightened preview/production environment validation.
- Cleared sensitive feature-store state whenever the session ends.

## Files Changed

| Area              | Files                                                                                                                                                                                                                                    |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| API transport     | `src/api/client.ts`, `src/api/authBridge.ts`, `src/api/errors.ts`, `src/api/response.ts`, `src/api/index.ts`, `src/api/README.md`                                                                                                        |
| Auth/session      | `src/features/auth/store/authStore.ts`, `src/features/auth/services/authSessionService.ts`, `src/features/auth/services/apiAuthBridge.ts`, `src/features/auth/services/index.ts`, `src/features/auth/screens/RoleAccessDeniedScreen.tsx` |
| Navigation/guards | `src/navigation/guards/navigationGuards.ts`, `src/navigation/guards/useStudentAccessGate.ts`, `src/navigation/RootNavigator.tsx`, `src/navigation/types.ts`, `src/navigation/config/initialFlow.ts`                                      |
| Environment       | `src/config/env.ts`, `App.tsx`, `app.config.ts`, `.env.example`                                                                                                                                                                          |
| Docs              | `docs/MOBILE_PHASE_1_RUNTIME_HARDENING.md`                                                                                                                                                                                               |

## Auto Refresh Flow

Protected requests pass `authToken` into `apiClient`. When a non-exempt request receives `401`:

1. The client starts or joins a shared refresh promise.
2. `useAuthStore.refreshAccessToken()` calls `POST /api/v1/auth/token/refresh/`.
3. The new access token is saved in SecureStore and in-memory auth state.
4. The original request retries once with the refreshed token.
5. If refresh fails, `forceSessionExpired()` clears the session and cached feature state.

Auth-exempt paths:

- `/api/v1/health/`
- `/api/v1/auth/login/`
- `/api/v1/auth/register/student/`
- `/api/v1/auth/register/normal/`
- `/api/v1/auth/token/refresh/`
- `/api/v1/auth/logout/`
- `/api/v1/auth/otp/send/`
- `/api/v1/auth/otp/verify/`
- `/api/v1/auth/request-password-reset/`
- `/api/v1/auth/confirm-password-reset/`

`403` responses are classified as `FORBIDDEN` and never trigger refresh.

## Error Handling Strategy

`src/api/errors.ts` normalizes errors into stable categories:

- `NETWORK_ERROR`
- `TIMEOUT`
- `VALIDATION_ERROR`
- `UNAUTHORIZED`
- `FORBIDDEN`
- `NOT_FOUND`
- `SERVER_ERROR`
- `UNKNOWN_ERROR`

Each normalized error includes:

- `message`: Arabic user-facing text
- `technicalMessage`: backend message when available
- `requestId`: backend `request_id` when available
- `status`: HTTP status when available
- `fieldErrors`: validation field map when available
- `raw`: original payload for internal debugging

Tokens and secrets are never logged.

## Auth and Session Lifecycle

1. Tokens are persisted in SecureStore.
2. App bootstrap restores tokens and validates the session through `GET /api/v1/auth/me/`.
3. If `/auth/me/` returns `401`, bootstrap attempts one refresh, then restores the user or clears
   the session.
4. Runtime protected API calls reuse the same refresh path through the API client.
5. Logout clears tokens, auth state, and all sensitive feature-store caches.
6. Expired sessions surface the Arabic message: `انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى.`

## Role Guard Behavior

| Role                                                       | Mobile behavior                              |
| ---------------------------------------------------------- | -------------------------------------------- |
| `student` with complete profile and approved verification  | Main student app tabs                        |
| `student` or `normal_user` without full setup/verification | Student setup flow                           |
| `admin`, `it_support`, `print_staff`                       | Access-denied screen with dashboard guidance |
| Unauthenticated                                            | Public auth flow                             |

Operational roles can log out from the access-denied screen and are not routed into student tabs.

## Remaining Risks

- The current backend still uses temporary HTTP/WS; store releases must move to HTTPS/WSS.
- WebSocket chat does not yet auto-refresh tokens after access-token expiry.
- EAS preview/production builds still require explicit env injection for API/WS URLs.
- Runtime behavior was not executed in this phase; only static/type-level validation was used.

## Phase 4 Test Checklist

- Login as a verified student and confirm uninterrupted usage across access-token expiry.
- Trigger concurrent protected requests during refresh and confirm only one refresh call occurs.
- Expire the refresh token and confirm graceful logout with Arabic messaging.
- Login as `admin`, `it_support`, and `print_staff` and confirm access-denied routing.
- Login as `normal_user` and confirm student setup routing.
- Verify FormData uploads still work without broken `Content-Type` headers.
- Verify backend `request_id` appears in normalized errors and internal logs.
- Build with missing or HTTP production env values and confirm strict validation fails safely.
