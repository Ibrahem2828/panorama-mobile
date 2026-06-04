# Phase 15 Chat Foundation

Phase 15 adds the student-facing group chat foundation: group ChatRoom UI, REST message list, REST message send, optional realtime WebSocket client, and permission-aware send input.

## Source Of Truth

The official `mobile_api_collection.json` file was inspected before implementation. Phase 15 uses only documented group messages contracts and the documented group chat WebSocket path.

## Endpoints Used

- `GET /api/v1/groups/{group_id}/messages/`
- `POST /api/v1/groups/{group_id}/messages/`

Message creation sends only the official request shape:

```json
{
  "type": "message",
  "content": "Hello"
}
```

## WebSocket Contract

The official API collection includes the group chat WebSocket path:

```text
ws://{host}/ws/v1/groups/{group_id}/chat/?token={access_token}
```

Phase 15 implements this as optional realtime support. REST remains the source of truth for loading, refreshing, and sending messages. If WebSocket cannot connect, the app keeps the ChatRoom usable through REST.

## Chat Architecture

- `src/api/types.ts` defines `GroupMessage` and `SendGroupMessageRequest`.
- `src/api/services/groups.service.ts` exposes `listGroupMessages` and `sendGroupMessage`.
- `src/features/chat/services/chatService.ts` normalizes messages, formats timestamps, checks send permissions, merges message lists, and maps safe Arabic errors.
- `src/features/chat/services/chatWebSocketService.ts` creates the optional WebSocket client without logging tokens.
- `src/features/chat/store/chatStore.ts` owns messages, draft text, loading, refresh, sending, errors, and connection status.
- `src/features/chat/screens/ChatRoomScreen.tsx` renders the real chat experience and delegates network behavior to the store.
- `src/features/chat/components/` contains reusable message bubble, input, header, status, permission notice, and empty-state UI.

## Group Integration

Group details now opens `ChatRoom` through the existing Groups stack route. The existing passive WhatsApp link behavior remains intact and separate from in-app chat.

## Permission Behavior

The Chat feature reads loaded group detail fields such as membership status, current user role, and send-message permission. The send input is hidden when the current user is not allowed to send, while the backend remains the final authority for permissions.

The input is intentionally conservative when group detail is unavailable on screen load: messages load through REST, but sending waits for group permission context.

## Security And Privacy

- Access tokens are passed only to API service calls or the WebSocket URL required by the official contract.
- Tokens are not logged.
- WebSocket error payloads are normalized to safe user-facing Arabic messages.
- Screens do not call the API client directly.
- Chat drafts stay in memory only.
- No sensitive backend payloads are exposed in UI errors.

## Intentionally Not Implemented

- Voice messages.
- Attachments.
- Reactions.
- Read receipts.
- Typing indicators.
- Message search.
- Message edit.
- Message pinning.
- Moderation tools.
- Push notifications.
- Admin chat tools.
- Message delete/report actions.
- New dependencies.
- Dev server, emulator, or EAS build execution.

## Validation

Executed validation commands:

```bash
npm run typecheck
npm run lint
npm run format:check
npm run expo:config
npm run validate
npm audit
npm audit --omit=dev
npx expo config --type public
npx expo-doctor
npx expo install --check
```

Result: all commands passed. `npx expo-doctor` passed 21/21 checks, and `npx expo install --check` reported that dependencies are up to date.

No Expo dev server, emulator, or EAS build is required for this phase.

## Next Phase Recommendation

Phase 16 can focus on runtime QA and UX polish: ChatRoom screen behavior on device, message pagination ergonomics, offline UX, realtime reconnect behavior, and visual spacing across mobile sizes.
