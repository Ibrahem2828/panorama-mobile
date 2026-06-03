# api

Central API layer for Panorama Mobile.

## Files

- `client.ts`: typed fetch wrapper that unwraps API envelopes and throws `ApiClientError`.
- `endpoints.ts`: centralized `/api/v1/` endpoint map.
- `errors.ts`: safe Arabic error normalization.
- `http.ts`: HTTP method, header, and content-type types.
- `pagination.ts`: pagination types and query helpers.
- `request.ts`: URL, header, and request builder.
- `response.ts`: response envelope types and type guards.
- `types.ts`: shared service record types.
- `services/`: API service foundations per module.
- `index.ts`: public API exports.

## Phase 7 additions

- `announcements.service.ts` exposes `listRelevantAnnouncements(authToken)`.
- Home consumes `announcements.list` and `notifications.unreadCount` through feature services.
- Announcement records are typed in `types.ts` and normalized inside the Home feature.

## Phase 8 additions

- `SubjectRecord` is typed in `types.ts`.
- `academic.service.ts` exposes `listSubjectsForMajor(majorId, params, authToken)`.
- Subjects use `GET /api/v1/majors/{major_id}/subjects/`.
- Supported query params for subjects are `academic_year`, `semester`, `search`, and `ordering`.
- No subject detail endpoint is defined because it is not present in the official API collection.

## Phase 9 additions

- `GroupRecord` and `GroupJoinResult` are typed in `types.ts`.
- `groups.service.ts` exposes real Groups list/detail/join/leave calls.
- Groups use `GET /api/v1/groups/available/`, `GET /api/v1/groups/my/`, and `GET /api/v1/groups/{group_id}/`.
- Join and leave use `POST /api/v1/groups/{group_id}/join/` and `POST /api/v1/groups/{group_id}/leave/`.
- Group message and group files endpoints are intentionally not used by Phase 9.

## Phase 10 additions

- `FileRecord` is expanded in `types.ts` for file metadata and optional view URL fields.
- `files.service.ts` exposes real Files list/detail/group-files calls.
- Files use `GET /api/v1/files/` and `GET /api/v1/files/{file_id}/`.
- Group files use `GET /api/v1/groups/{group_id}/files/`.
- No file download, stream, signed URL, subject files, or printing order endpoint is added by Phase 10.

## Phase 11 additions

- `PrintOrder`, `PrintOrderItem`, and `CreatePrintOrderRequest` are typed in `types.ts`.
- `printing.service.ts` exposes create, my orders, detail, and cancel calls.
- Printing create uses `POST /api/v1/printing/orders/`.
- My printing orders uses `GET /api/v1/printing/orders/my/`.
- Printing detail and cancel use `GET /api/v1/printing/orders/{order_id}/` and `POST /api/v1/printing/orders/{order_id}/cancel/`.
- No printing services/options, pricing, payment, upload, or file picker API is added by Phase 11.

## Phase 12 additions

- `NotificationRecord`, `UnreadCountResponse`, and device-token request types are expanded in `types.ts`.
- `notifications.service.ts` exposes list, unread count, mark read, read all, register device token, and delete device token functions.
- Notifications list uses `GET /api/v1/notifications/`.
- Unread count uses `GET /api/v1/notifications/unread-count/`.
- Read actions use `POST /api/v1/notifications/{notification_id}/read/` and `POST /api/v1/notifications/read-all/`.
- Device token endpoints are typed service-level foundations only and are not called by app runtime.
- No push notifications, permissions, FCM/APNs, settings, or notification detail endpoint is added by Phase 12.

## Phase 13 additions

- `SupportTicket`, `SupportTicketMessage`, and support request types are expanded in `types.ts`.
- `support.service.ts` exposes create, my tickets, detail, and add-message calls.
- Create ticket uses `POST /api/v1/support/tickets/`.
- My tickets uses `GET /api/v1/support/tickets/my/`.
- Ticket detail uses `GET /api/v1/support/tickets/{ticket_id}/`.
- Add message uses `POST /api/v1/support/tickets/{ticket_id}/messages/`.
- No attachments, category API, close/reopen, staff/admin support tools, realtime chat, or invented support endpoints are added by Phase 13.

## Phase 14 additions

- `UpdateCurrentUserRequest` and `ChangePasswordRequest` are typed in `types.ts`.
- `auth.service.ts` exposes current-user update and change-password calls.
- Current user reads use `GET /api/v1/auth/me/`.
- Profile update uses `PATCH /api/v1/auth/me/` and sends only `full_name` and `username`.
- Change password uses `POST /api/v1/auth/change-password/`.
- Student profile and verification display reuse existing `GET /api/v1/students/me/profile/` and `GET /api/v1/verification/me/` services.
- No delete-account, profile-photo, preferences, notification settings, or unsupported account endpoint is added by Phase 14.

## Rules

- Do not store tokens in `src/api`.
- Do not use SecureStore or Zustand inside the API layer.
- Do not add automatic refresh interceptors until that phase is explicitly scoped.
- Pass `authToken` explicitly from the feature/auth layer when needed.
- Do not place endpoint strings outside `endpoints.ts`.
- Do not call the API client directly from screens.
