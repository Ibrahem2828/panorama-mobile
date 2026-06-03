# groups

Groups feature foundation for verified students.

## Implemented In Phase 9

- Groups overview screen.
- Available Groups screen.
- My Groups screen.
- Group details screen.
- Join group action.
- Leave group action.
- Membership status display.
- Current user group role display.
- Send messages permission display.
- Members count display when returned by the backend.
- Group image/avatar display when a safe image URL is returned.
- Group description rendering.
- Passive WhatsApp link support for safe WhatsApp URLs only.
- Phase 10 adds navigation from Group details to real Group files.

## Structure

- `components/`: reusable Groups UI components.
- `screens/`: Groups stack screens.
- `services/`: feature-level normalization, helpers, and API service orchestration.
- `store/`: Zustand state for lists, details, refresh, errors, and membership actions.
- `types.ts`: flexible typed Groups models using `unknown` for unknown backend fields.

## API Scope

Phase 9 uses only official API collection endpoints:

- `GET /api/v1/groups/available/`
- `GET /api/v1/groups/my/`
- `GET /api/v1/groups/{group_id}/`
- `POST /api/v1/groups/{group_id}/join/`
- `POST /api/v1/groups/{group_id}/leave/`

Screens use the Groups store and never call the API client directly.

## Phase 10 Files Integration

Group details now links to `GroupFiles`, which is implemented in `src/features/files` and uses
`GET /api/v1/groups/{group_id}/files/`. Groups still do not implement chat or message APIs.

## WhatsApp Links

WhatsApp links are optional and passive. The feature checks known optional fields and the group
description for safe WhatsApp URLs, then opens them with React Native `Linking` only after user
press. It does not parse HTML, create previews, or open arbitrary URLs.

## Deferred

- Chat messages.
- WebSocket.
- Message sending, deletion, reporting, and typing indicators.
- Advanced PDF rendering.
- Admin/moderator management tools.
