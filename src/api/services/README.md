# API services

These files are thin service foundations over `apiClient`. They are not complete feature implementations.

## Available

- `academic.service.ts`
- `announcements.service.ts`
- `auth.service.ts`
- `files.service.ts`
- `groups.service.ts`
- `notifications.service.ts`
- `printing.service.ts`
- `support.service.ts`
- `verification.service.ts`

## Phase 7 additions

- `announcements.service.ts` calls `GET /api/v1/announcements/`.
- `notifications.service.ts` continues to expose `getUnreadCount` for Home.

## Phase 8 additions

- `academic.service.ts` calls `GET /api/v1/majors/{major_id}/subjects/` for subjects.
- Subject list params support `academic_year`, `semester`, `search`, and `ordering`.
- Subject details are handled in the Subjects feature from loaded list data, not through an API service endpoint.

## Phase 9 additions

- `groups.service.ts` calls `GET /api/v1/groups/available/` for available groups.
- `groups.service.ts` calls `GET /api/v1/groups/my/` for the current student's groups.
- `groups.service.ts` calls `GET /api/v1/groups/{group_id}/` for group detail.
- `groups.service.ts` calls `POST /api/v1/groups/{group_id}/join/` and `POST /api/v1/groups/{group_id}/leave/`.
- Group messages and group files are intentionally not implemented in Phase 9.

## Phase 10 additions

- `files.service.ts` calls `GET /api/v1/files/` for accessible files.
- `files.service.ts` calls `GET /api/v1/files/{file_id}/` for file detail.
- `files.service.ts` calls `GET /api/v1/groups/{group_id}/files/` for group files.
- File download, file stream, signed URL, subject files, and printing order endpoints are intentionally not implemented in Phase 10.

## Rules

- Services may import only API-layer helpers such as `apiClient`, `endpoints`, and shared API types.
- No React hooks are allowed here.
- No token storage is allowed here.
- No Zustand, SecureStore, or TanStack Query is allowed here.
- Auth service calls backend endpoints only; session orchestration stays in `src/features/auth/services`.
- Services that need authentication receive `authToken` from the feature layer.
