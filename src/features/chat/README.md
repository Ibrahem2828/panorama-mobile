# chat

Student group chat foundation implemented in Phase 15.

## Implemented In Phase 15

- Real ChatRoom screen for group messages.
- REST-first message loading through the official group messages endpoint.
- Message sending through the official group messages endpoint.
- Optional WebSocket client using the official group chat path.
- Safe reconnect status display with REST fallback.
- Send permission checks based on loaded group detail fields.
- Empty, loading, refresh, error, permission, and sending states.
- Arabic RTL chat UI with reusable message, header, status, notice, and input components.

## Structure

- `components/`: reusable chat UI components.
- `screens/`: ChatRoom screen.
- `services/`: message normalization, permission helpers, REST orchestration, and optional WebSocket client.
- `store/`: Zustand state for messages, drafts, loading, sending, refresh, and realtime status.
- `types.ts`: flexible chat models using `unknown` for backend fields not yet finalized.

## API Scope

Phase 15 uses only official API collection contracts:

- `GET /api/v1/groups/{group_id}/messages/`
- `POST /api/v1/groups/{group_id}/messages/`

Message creation sends only:

```json
{
  "type": "message",
  "content": "..."
}
```

Screens use the Chat store and never call the API client directly.

## WebSocket Scope

The optional realtime client uses the official path:

```text
ws://{host}/ws/v1/groups/{group_id}/chat/?token={access_token}
```

`EXPO_PUBLIC_WS_BASE_URL` supplies the host separately from the REST API base. HTTP deployments
use WS; production HTTPS deployments must use WSS. The access token is URL-encoded, and the
complete token-bearing URL is never logged.

REST remains the source of truth. If WebSocket is unavailable, the user can still load, refresh, and send messages through REST.

## Deferred

- Voice messages.
- Attachments.
- Reactions.
- Read receipts.
- Typing indicators.
- Message search.
- Message edit.
- Pinned messages.
- Moderation tools.
- Push notifications.
- Admin chat tools.
- Message delete/report actions.
