# Phase 12: Notifications Foundation

## Goal

Phase 12 implements the real in-app Notifications foundation. The goal is to make the notifications
section useful for students without implementing push notifications, device permissions, FCM/APNs, or
runtime device-token registration.

## Source Of Truth

The official `mobile_api_collection.json` file was inspected before implementation and used as the
source of truth. No notification endpoint outside the collection was invented.

## Official API Scope

Phase 12 uses:

- `GET /api/v1/notifications/`
- `GET /api/v1/notifications/unread-count/`
- `POST /api/v1/notifications/{notification_id}/read/`
- `POST /api/v1/notifications/read-all/`
- `POST /api/v1/notifications/device-tokens/`
- `DELETE /api/v1/notifications/device-tokens/{token_id}/`

The device-token endpoints are implemented only as typed API service functions for a later push
phase.

## Why Push Was Not Implemented

Push notifications require platform permission flows, production credentials, FCM/APNs setup,
runtime token registration, and additional privacy decisions. Phase 12 intentionally implements only
the in-app inbox and read-state behavior.

No `expo-notifications`, Firebase, Notifee, permission request, scheduler, or runtime device token
registration was added.

## API Layer

`src/api/services/notifications.service.ts` exposes:

- `listNotifications(authToken)`
- `getUnreadCount(authToken)`
- `markNotificationRead(notificationId, authToken)`
- `markAllNotificationsRead(authToken)`
- `registerDeviceToken(input, authToken)`
- `deleteDeviceToken(tokenId, authToken)`

All functions receive auth tokens explicitly. The API layer does not import Zustand, SecureStore, or
React hooks.

## Feature Service

`src/features/notifications/services/notificationsService.ts` handles:

- Flexible backend response normalization.
- Arabic-safe error messages.
- Notification title/body fallback.
- Type label and badge variant mapping.
- Read/unread detection.
- Safe target metadata extraction.
- Date formatting.

`notificationRoutingService.ts` resolves safe route intents without executing arbitrary backend data.

## Store Architecture

`src/features/notifications/store/notificationsStore.ts` owns:

- Notifications list.
- Unread count.
- Loading, refresh, mark-read, and mark-all flags.
- Error and success messages.
- Optimistic read-state updates.

If a mark-read API call fails, the store reverts the optimistic update. The store also syncs Home's
unread count locally through `useHomeStore.setUnreadNotificationsCount`.

## UI Components

Created:

- `NotificationCard`
- `NotificationStatusBadge`
- `NotificationsHeaderActions`
- `NotificationMetaRow`

The screen uses existing design-system primitives and supports loading, error, empty, refresh, and
read/unread states.

## Routing Foundation

If safe target metadata exists:

- `printing` or `print_order` with `target_id` opens `PrintOrderDetails`.
- `group` with `target_id` opens `GroupDetails`.
- `file` with `target_id` opens `FileDetails`.
- `verification`, `announcement`, and `support` are treated as future routing intents.
- Unknown targets do nothing beyond marking the notification read.

No notification detail endpoint or broad deep-link system was invented.

## Home Unread Count

Home still loads its initial unread count through the Home feature. Phase 12 adds a small local sync
so mark-read and mark-all actions update the Home unread count during the current session. A fuller
shared notification-count architecture can be refined later.

## Security And Privacy

- Tokens remain in SecureStore/auth state and are passed explicitly to services.
- Full notification payloads are not logged.
- Device tokens are not logged or registered at runtime.
- Unknown `data` fields are inspected safely and are not rendered as raw JSON.
- Backend authorization remains the source of truth for user-owned notifications.

## Intentionally Not Implemented

- Push notifications.
- Notification permissions.
- FCM/APNs.
- Runtime device-token registration.
- Notification scheduling.
- Notification settings.
- Notification detail endpoint.
- Support tickets.
- Chat/WebSocket.
- Admin notifications.
- New dependencies.

## Validation

Final validation was run on 2026-06-03:

- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm run format:check`: passed.
- `npm run expo:config`: passed.
- `npm run validate`: passed.
- `npm audit`: passed, 0 vulnerabilities.
- `npm audit --omit=dev`: passed, 0 vulnerabilities.
- `npx expo config --type public`: passed.
- `npx expo-doctor`: passed, 21/21 checks.
- `npx expo install --check`: passed, dependencies are up to date.

The Expo dev server, emulator, and EAS build were not started.

## Next Phase Recommendation

Phase 13 should implement Support Tickets Foundation using only the official support ticket endpoints,
while keeping chat, push notifications, and admin workflows out of scope unless explicitly requested.
