# subjects

Feature foundation for the authenticated Subjects experience.

## Phase 8 scope

- Loads real subjects from `GET /api/v1/majors/{major_id}/subjects/`.
- Determines `major`, `academic_year`, and `semester` from the current student profile state.
- Sends `academic_year` and `semester` query params when those IDs are available.
- Provides local search over loaded subject `name`, `title`, and `code`.
- Shows a subject detail foundation derived from the loaded list data.
- Keeps subject-specific files, chat, and subject announcements out of scope because their endpoints are not documented.

## Files

- `screens/SubjectsListScreen.tsx`: real subjects list UI.
- `screens/SubjectDetailsScreen.tsx`: subject detail foundation from store/list data.
- `services/subjectsService.ts`: feature service over `academicService.listSubjectsForMajor`.
- `store/subjectsStore.ts`: Zustand state for subjects, selected subject, local search, loading, refresh, and errors.
- `components/`: cards, search bar, detail header, meta rows, and linked-section placeholders.
- `types.ts`: flexible typed subject model.

## Boundaries

- No subject detail endpoint is used or invented.
- No subject-specific files endpoint is used or invented.
- Phase 10 allows the subject detail files card to open the general accessible Files list.
- No subject-specific groups endpoint is used or invented.
- No chat, WebSocket, PDF viewer, printing, notifications list, or support logic is implemented here.
- No new dependencies are introduced in Phase 8.
