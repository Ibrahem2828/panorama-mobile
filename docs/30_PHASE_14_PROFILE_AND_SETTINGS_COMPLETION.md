# Phase 14 Profile And Settings Completion

Phase 14 completes the student-facing account area for MVP: real profile, edit profile, academic info, settings, change password, legal screens, and logout confirmation.

## Source Of Truth

The official `mobile_api_collection.json` file was inspected before implementation. Phase 14 uses only documented current-user and student-read endpoints.

## Endpoints Used

- `GET /api/v1/auth/me/`
- `PATCH /api/v1/auth/me/`
- `POST /api/v1/auth/change-password/`
- `GET /api/v1/students/me/profile/`
- `GET /api/v1/verification/me/`

## Profile Architecture

- `src/api/services/auth.service.ts` exposes current-user read/update and change-password functions.
- `src/features/profile/services/profileService.ts` normalizes user display fields, safe labels, and Arabic error messages.
- `src/features/profile/store/profileStore.ts` owns profile user, edit draft, loading, submitting, and safe update behavior.
- `src/features/profile/components/` contains reusable summary, action, academic info, security, and legal blocks.

## Settings Architecture

- `src/features/settings/services/settingsService.ts` validates change-password input and calls the official auth API service.
- `src/features/settings/store/settingsStore.ts` owns the in-memory password draft, validation, submitting, and success/error states.
- `src/features/settings/components/` contains reusable setting rows and sections.

## Behaviors

Edit profile sends only `full_name` and `username` to `PATCH /api/v1/auth/me/`. Email, phone, role, and academic fields are read-only.

Change password sends `old_password`, `new_password`, and `new_password_confirm` to `POST /api/v1/auth/change-password/`. Passwords are kept only in the in-memory Zustand draft and are not logged.

Academic Info displays student profile and verification state from existing student profile and verification stores. It does not update academic fields and does not expose verification image URLs.

Logout now requires explicit confirmation before calling the existing auth logout flow.

Privacy Policy, Terms, and About are static MVP screens with concise Arabic content.

## Intentionally Not Implemented

- Delete account.
- Profile photo upload.
- Email, phone, or role editing.
- Sensitive academic field editing in Profile.
- Notification preferences API.
- Privacy settings API.
- User preferences endpoint.
- Dark mode persistence.
- Language switching persistence.
- Chat/WebSocket.
- New dependencies.
- Unsupported account endpoints.

## Validation

Executed validation commands:

```bash
npm run typecheck
npm run lint
npm run format:check
npm run expo:config
npm run validate
npm audit
npm audit --omit=dev
npx expo config --type public
npx expo-doctor
npx expo install --check
```

Result: all commands passed. `npx expo-doctor` passed 21/21 checks, and `npx expo install --check` reported that dependencies are up to date.

No Expo dev server, emulator, or EAS build is required for this phase.

## Next Phase Recommendation

Phase 15 can start Chat Foundation using only official group message/WebSocket contracts after re-inspecting the API collection.
