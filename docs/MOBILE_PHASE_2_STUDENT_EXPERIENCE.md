# Mobile Phase 2: Student Experience & App Flow Excellence

## Summary

Phase 2 polishes the Arabic/RTL student journey, closes auth dead-ends, enforces a setup state
machine with anti-flicker loading, and improves Home, Profile, Settings, and shared UI states —
without changing Phase 1 API/auth runtime architecture.

## Scope Completed

- Student journey state machine with loading gate and setup flow resolver
- Auth dead-end closure (Login entry, unavailable-flow safety screens)
- Login UX polish (Arabic copy, keyboard handling, student helper text)
- Academic profile setup improvements (normal_user intro, validation, empty states)
- Verification flow copy and behavior per status
- Home dashboard hub (greeting, status, academic summary, support quick action)
- Profile/settings readability (Arabic labels, app version, environment)
- Brand token alignment and shared state polish
- Role access-denied copy alignment

## Screens and Flows Changed

| Area             | Files                                                                                                                                                  |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Journey          | `src/navigation/guards/studentJourney.ts`, `useStudentAccessGate.ts`, `StudentSetupFlowResolver.tsx`, `RootNavigator.tsx`, `StudentSetupNavigator.tsx` |
| Auth UX          | `LoginScreen.tsx`, `UnavailableAuthFlowScreen.tsx`, Register/Forgot/OTP/Reset screens, `PublicNavigator.tsx`                                           |
| Setup            | `AcademicProfileSetupScreen.tsx`, `NormalUserIntroCard.tsx`                                                                                            |
| Verification     | `SubmitVerificationScreen.tsx`, `VerificationStatusScreen.tsx`, `VerificationStatusCard.tsx`, `VerificationCardImagePicker.tsx`                        |
| Home             | `HomeScreen.tsx`, `HomeGreetingCard.tsx`, `HomeAcademicSummaryCard.tsx`, `home/types.ts`                                                               |
| Profile/Settings | `SettingsScreen.tsx`                                                                                                                                   |
| Shared/Theme     | `colors.ts`, `LoadingState.tsx`, `ErrorState.tsx`, `RoleAccessDeniedScreen.tsx`                                                                        |

## Student Journey Rules

| State                                  | Routing                                |
| -------------------------------------- | -------------------------------------- |
| Not authenticated                      | Public Login (no protected tabs)       |
| Context loading                        | `StudentContextLoadingScreen`          |
| `normal_user` / incomplete profile     | Academic profile setup                 |
| Complete profile, no verification      | Submit verification                    |
| `pending`                              | Verification status (no repeat submit) |
| `rejected` / `needs_update`            | Verification status + resubmit CTA     |
| `approved` + complete profile          | Main app tabs                          |
| `admin` / `it_support` / `print_staff` | Access denied + logout                 |
| Unknown role                           | Access denied fallback                 |

Resolver entry: `StudentSetupRoutes.SetupFlow` → replaces to the correct setup screen.

## Auth Placeholder Decision

Backend endpoints exist for register/OTP/password reset, but mobile screens were placeholders.
Phase 2 **does not** implement these flows. Instead:

- Public flow starts at **Login** (not Splash placeholder)
- Login removes links to unfinished flows
- Register/Forgot/OTP/Reset show `UnavailableAuthFlowScreen` with Arabic guidance to contact university administration
- No false promises of self-service account creation

## Verification UX Behavior

- **none:** Explains why verification is required; guides image upload
- **pending:** Review message; refresh only; discourages resubmission
- **rejected / needs_update:** Shows rejection reason; resubmit CTA
- **approved:** Success state; enter-app CTA re-bootstraps profile/verification stores for root gate transition

## Role Routing Behavior

Unchanged from Phase 1 mechanics, with updated Arabic copy on access-denied screen per product spec.

## Remaining Risks

- Self-service registration and password reset remain deferred
- Splash/Onboarding routes exist but are not part of the default public entry
- WebSocket chat token refresh not addressed
- Runtime behavior not manually validated in this phase (typecheck only)
- HTTPS/production env migration still pending

## Phase 3 Should Handle

- Product onboarding/splash flow
- Full self-service registration and password reset (if backend confirms UX)
- Search placeholder replacement
- TanStack Query caching layer
- WebSocket reconnect/token refresh polish
- HTTPS migration and Phase 4 runtime QA

## Runtime Validation

The app was **not** run in Phase 2. No `expo start`, emulator, iOS simulator, Android build, or EAS build was executed. Only `npm run typecheck` was run successfully.
