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

## Phase 11 additions

- `printing.service.ts` calls `POST /api/v1/printing/orders/` for create order.
- `printing.service.ts` calls `GET /api/v1/printing/orders/my/` for the current student's print orders.
- `printing.service.ts` calls `GET /api/v1/printing/orders/{order_id}/` for print order detail.
- `printing.service.ts` calls `POST /api/v1/printing/orders/{order_id}/cancel/` for cancellation.
- Create order accepts only the official JSON body: `items[{ source_file, copies }]` and optional `user_notes`.
- Printing services/options, pricing, payment, upload, and file picker endpoints are intentionally not implemented in Phase 11.

## Phase 12 additions

- `notifications.service.ts` calls `GET /api/v1/notifications/` for the current user's notifications.
- `notifications.service.ts` calls `GET /api/v1/notifications/unread-count/` for unread count.
- `notifications.service.ts` calls `POST /api/v1/notifications/{notification_id}/read/`.
- `notifications.service.ts` calls `POST /api/v1/notifications/read-all/`.
- `notifications.service.ts` exposes `POST /api/v1/notifications/device-tokens/` and `DELETE /api/v1/notifications/device-tokens/{token_id}/` as future service functions only.
- Device token service functions are not called from runtime in Phase 12.

## Phase 13 additions

- `support.service.ts` calls `POST /api/v1/support/tickets/` for ticket creation.
- `support.service.ts` calls `GET /api/v1/support/tickets/my/` for the current student's tickets.
- `support.service.ts` calls `GET /api/v1/support/tickets/{ticket_id}/` for ticket detail.
- `support.service.ts` calls `POST /api/v1/support/tickets/{ticket_id}/messages/` for student messages.
- Create ticket accepts only the official JSON body: `category`, `subject`, and `message`.
- Add message accepts only the official JSON body: `message`.
- Attachments, category API, close/reopen, staff assignment, staff/admin tools, and realtime chat are intentionally not implemented in Phase 13.

## Rules

- Services may import only API-layer helpers such as `apiClient`, `endpoints`, and shared API types.
- No React hooks are allowed here.
- No token storage is allowed here.
- No Zustand, SecureStore, or TanStack Query is allowed here.
- Auth service calls backend endpoints only; session orchestration stays in `src/features/auth/services`.
- Services that need authentication receive `authToken` from the feature layer.
