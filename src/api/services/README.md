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

## Rules

- Services may import only API-layer helpers such as `apiClient`, `endpoints`, and shared API types.
- No React hooks are allowed here.
- No token storage is allowed here.
- No Zustand, SecureStore, or TanStack Query is allowed here.
- Auth service calls backend endpoints only; session orchestration stays in `src/features/auth/services`.
- Services that need authentication receive `authToken` from the feature layer.
