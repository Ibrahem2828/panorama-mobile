# chat

Group chat for approved members, at parity with the web chat.

## Behaviour

- **Entry guard**: only approved members (or staff roles) open the room; others see a friendly
  explanation. A 403 from the server (membership changed) switches the room to the same state.
- **Realtime**: ticketed WebSocket (a fresh single-use ticket per connect), exponential backoff with
  jitter, pause on background / resume on foreground and on network return, REST catch-up on every
  (re)connect. REST polling runs only while the socket is not connected, foreground and online.
- **De-duplication**: messages merge by server id (socket, REST pages, send responses); the sender's
  own socket echo replaces its optimistic bubble; live `message.deleted` frames are honoured and a
  stale page never resurrects them.
- **Sending**: optimistic bubbles (`sending` -> `failed`), one idempotency key per send that is reused
  on retry (and replaced after a definitive 4xx), one-tap retry or delete, image attachments via
  multipart with upload progress and cancel. Limit 4000 characters (backend serializer).
- **History**: inverted `FlatList`; older pages load on reaching the top (page 2, 3, ...);
  `maintainVisibleContentPosition` keeps the reading position; "jump to latest" button with a counter
  of messages that arrived while reading history; day separators and sender grouping.
- **Attachments**: images only (PNG/JPG/WEBP, 25 MB) because only `expo-image-picker` is installed.
  Viewing goes through the protected attachment ticket, in-app only, screen capture blocked.

## Structure

- `logic/`: pure, unit-tested code (message normalise/merge/prune, optimistic state machine, day
  grouping, attachment validation).
- `services/`: REST calls, permission rules, WebSocket client (`chatWebSocketService`), app-state and
  network environment.
- `store/`: zustand store with per-room state (messages, pending, pagination, errors).
- `components/`: list, rows, composer (owns its own text state), viewer, header, status line.
- `screens/ChatRoomScreen.tsx`: wires the above together.

## Not implemented (web has them)

Reply/quote, delete-own-message, report, typing indicator, persisted unsent queue across app restarts.
