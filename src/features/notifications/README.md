# notifications

In-app notifications foundation for Panorama Mobile.

## Implemented In Phase 12

- Real Notifications screen.
- Notifications list from `GET /api/v1/notifications/`.
- Unread count from `GET /api/v1/notifications/unread-count/`.
- Mark one notification as read.
- Mark all notifications as read.
- Loading, refresh, error, and empty states.
- Read/unread visual state.
- Notification type badges.
- Basic safe routing foundation for printing orders, groups, and files.

## Structure

- `components/`: NotificationCard, status badge, header actions, and metadata row.
- `screens/`: NotificationsScreen.
- `services/`: response normalization, helpers, API orchestration, and routing intent resolution.
- `store/`: Zustand state for notifications, unread count, refresh, read actions, and errors.
- `types.ts`: flexible notification and device-token types using `unknown` for backend fields.

## API Scope

Phase 12 uses only official API collection endpoints:

- `GET /api/v1/notifications/`
- `GET /api/v1/notifications/unread-count/`
- `POST /api/v1/notifications/{notification_id}/read/`
- `POST /api/v1/notifications/read-all/`
- `POST /api/v1/notifications/device-tokens/`
- `DELETE /api/v1/notifications/device-tokens/{token_id}/`

Device token functions exist in services for future push integration only.

## Deferred

- Push notifications.
- `expo-notifications`.
- FCM/APNs.
- Runtime device token registration.
- Notification permissions.
- Notification settings.
- Notification detail endpoint.
- Full deep-linking coverage.
