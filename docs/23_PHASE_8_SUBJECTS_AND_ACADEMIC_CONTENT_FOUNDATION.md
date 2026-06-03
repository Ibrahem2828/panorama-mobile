# Phase 8 - Subjects & Academic Content Foundation

## Goal

Phase 8 turns the Subjects tab into the first real academic content module. It loads the authenticated student's subjects from the official Academic Data endpoint, supports local search, and provides a subject detail foundation without implementing files, groups, chat, or subject-specific announcements.

## Source Of Truth

The official `mobile_api_collection.json` file in the project root was inspected before implementation.

Confirmed endpoint:

- `GET /api/v1/majors/{major_id}/subjects/`
  - Public endpoint.
  - Returns paginated data under `data.results`.
  - Notes support filtering by `academic_year` and `semester`.

No unconfirmed endpoint was introduced.

## Endpoint Used

Subjects use:

```txt
GET /api/v1/majors/{major_id}/subjects/
```

Query params used when available:

- `academic_year`
- `semester`
- `ordering`

The feature service accepts `search`, but Phase 8 screens intentionally use local search only and do not call backend search on keystrokes.

## No Subject Detail Endpoint

The API collection does not define:

- `GET /api/v1/subjects/{id}/`
- `GET /api/v1/students/me/subjects/`

Subject details are therefore derived from the loaded subjects list. If a detail screen is opened without a subject in memory, the store reloads the subjects list once and searches locally by `subjectId`.

## API Layer

Updated:

- `src/api/types.ts`
- `src/api/services/academic.service.ts`

`SubjectRecord` was added as a flexible API model. `academic.service.ts` now exposes `listSubjectsForMajor` with subject-specific filters while continuing to use the centralized endpoint map.

## Subjects Service Architecture

Added:

- `src/features/subjects/services/subjectsService.ts`
- `src/features/subjects/services/index.ts`

The service:

- Calls `academicService.listSubjectsForMajor`.
- Normalizes subject records into UI-safe `Subject` objects.
- Provides safe helpers for subject display name, code, description, relation labels, and local search.
- Converts API errors into Arabic UI messages.

## Subjects Store Architecture

Added:

- `src/features/subjects/store/subjectsStore.ts`
- `src/features/subjects/store/index.ts`

The store owns:

- `subjects`
- `selectedSubject`
- `search`
- `isLoading`
- `isRefreshing`
- `errorMessage`
- `lastLoadedAt`
- `lastLoadKey`
- `totalCount`
- `stateSource`

It reads the current auth token from auth state if available and academic identity from the student profile store. It does not persist subject data or tokens.

## UI Components

Added:

- `SubjectCard`
- `SubjectDetailHeader`
- `SubjectSearchBar`
- `SubjectMetaRow`
- `SubjectLinkedSectionCard`

All components are presentational and do not perform API calls.

## Screens

Updated:

- `src/features/subjects/screens/SubjectsListScreen.tsx`
- `src/features/subjects/screens/SubjectDetailsScreen.tsx`

The list screen:

- Loads subjects on mount.
- Shows loading, error, empty, and content states.
- Provides a refresh button.
- Provides local search over loaded subject name, title, and code.
- Navigates to SubjectDetails with `{ subjectId }`.

The detail screen:

- Uses selected/list subject data.
- Reloads the list once if the subject is missing.
- Shows disabled placeholders for files, groups, and announcements.
- Does not call files, groups, announcements, or subject-detail APIs.

## Navigation Behavior

`SubjectsStackParamList.SubjectDetails` now accepts:

```ts
{
  subjectId: string | number;
}
```

The Home quick action to Subjects continues to navigate to the existing Subjects tab and SubjectsList route.

## Intentionally Not Implemented

- Files list.
- Group list.
- Group details.
- Chat or WebSocket.
- PDF viewer.
- Printing.
- Notifications list.
- Support.
- Subject-specific announcements.
- Subject detail backend endpoint.
- TanStack Query.
- New dependencies.
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

Phase 9 should implement Groups Foundation using the same approach:

- Inspect the official API collection first.
- Use only documented groups endpoints.
- Keep API services thin.
- Keep feature orchestration in the Groups feature.
- Preserve Arabic RTL-first UX.
- Leave chat implementation to a later phase unless explicitly scoped.
