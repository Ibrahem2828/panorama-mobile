# Phase 7 - Home & Announcements Foundation

## Goal

Phase 7 replaces the placeholder Home screen with an authenticated, student-oriented Home foundation. The screen now shows a greeting, student status summary, announcements, unread notification count, and quick actions to existing mounted sections.

## Source of Truth

The API contract was validated against `mobile_api_collection.json` before implementation.

Confirmed endpoints:

- `GET /api/v1/announcements/`
  - Authenticated endpoint.
  - Returns a paginated response under `data.results`.
  - Used for relevant announcements.
- `GET /api/v1/notifications/unread-count/`
  - Authenticated endpoint.
  - Returns `{ count: number }`.
  - Used only for the Home unread notification indicator in this phase.

No unconfirmed endpoints were introduced.

## API Layer

Added:

- `src/api/services/announcements.service.ts`
- `AnnouncementRecord` in `src/api/types.ts`
- Public export for `announcementsService` in `src/api/index.ts`

The announcements service is intentionally thin. It receives `authToken` explicitly and delegates request construction to the shared API client.

## Feature Architecture

Added Home feature modules:

- `src/features/home/types.ts`
- `src/features/home/services/homeService.ts`
- `src/features/home/services/index.ts`
- `src/features/home/store/homeStore.ts`
- `src/features/home/store/index.ts`
- `src/features/home/index.ts`

`homeService` combines announcements and unread count with `Promise.all`, normalizes announcement records into UI-safe data, and returns safe Arabic error messages through existing API error normalization.

`homeStore` owns Home-only state:

- `announcements`
- `unreadNotificationsCount`
- `isLoading`
- `isRefreshing`
- `errorMessage`
- `lastLoadedAt`
- `lastAuthUserId`

It reads the current auth token from `useAuthStore.getState()` and does not persist Home data or tokens.

## UI Components

Added:

- `AnnouncementCard`
- `HomeGreetingCard`
- `HomeQuickActionCard`
- `HomeSectionHeader`
- `StudentStatusCard`

All components are presentational and reuse existing design system primitives. No component performs API calls.

## Home Screen Behavior

Updated:

- `src/features/home/screens/HomeScreen.tsx`

Behavior:

- Loads Home data on mount.
- Supports manual refresh.
- Shows loading, error, empty announcements, and content states.
- Shows unread notifications count.
- Shows profile and verification status based on existing auth/session state.
- Uses only mounted navigation targets for quick actions.
- Leaves shared files disabled until a mounted route exists.

## Navigation

Quick actions navigate only to existing routes:

- Subjects tab: `SubjectsRoutes.SubjectsList`
- Groups tab: `GroupsRoutes.GroupsOverview`
- Printing tab: `PrintingRoutes.PrintHome`
- Profile tab: `ProfileRoutes.Notifications`
- Profile tab: `ProfileRoutes.ProfileHome`

No new route names were invented in Phase 7.

## Security And Privacy

- Tokens remain in SecureStore/auth state and are passed explicitly to API services.
- Home data is not persisted.
- No sensitive values are logged.
- API failures are normalized into safe Arabic UI messages.
- Screens do not call `apiClient` directly.

## Intentionally Not Implemented

- Full notifications inbox.
- Announcement details screen.
- Real downstream feature data for Subjects, Groups, Files, Printing, or Support.
- TanStack Query.
- WebSocket subscriptions.
- Push notification listeners.
- New backend endpoints.
- Dev server execution.

## Validation Results

Validation completed successfully after code and documentation changes:

- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm run format:check`: passed.
- `npm run expo:config`: passed.
- `npm run validate`: passed.
- `npm audit`: passed with `found 0 vulnerabilities`.
- `npm audit --omit=dev`: passed with `found 0 vulnerabilities`.
- `npx expo config --type public`: passed.
- `npx expo-doctor`: passed with `21/21 checks passed`.
- `npx expo install --check`: passed with dependencies up to date.

## Audit Results

- No npm vulnerabilities were reported.
- Expo Doctor reported no issues.
- Expo dependency compatibility check reported dependencies are up to date.
- No dev server, emulator, or EAS build command was executed.

## Next Phase Recommendation

Phase 8 should implement one downstream feature end-to-end from the existing mounted tabs, preferably Subjects or Notifications, using the same constraints:

- Confirm endpoints from the API collection first.
- Keep API services thin.
- Keep feature orchestration inside the feature module.
- Avoid new dependencies unless strictly required.
- Preserve Arabic RTL-first UX.
