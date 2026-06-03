# Phase 9: Groups Foundation

## Goal

Phase 9 makes the Groups module useful for verified students without entering the later chat,
WebSocket, or files scope.

Implemented user-facing foundations:

- Real Groups overview.
- Real Available Groups list.
- Real My Groups list.
- Real Group details.
- Join group request.
- Leave group request.
- Membership status, group role, send permission, member count, image, and description display.
- Passive WhatsApp link support when a safe WhatsApp URL is returned or appears in the group description.

## Source Of Truth

The official mobile API collection in the project root was inspected before implementation.
Only documented Groups endpoints were used. No dashboard, management, message, WebSocket, or
files endpoint was invented.

## Endpoints Used

- `GET /api/v1/groups/available/`
- `GET /api/v1/groups/my/`
- `GET /api/v1/groups/{group_id}/`
- `POST /api/v1/groups/{group_id}/join/`
- `POST /api/v1/groups/{group_id}/leave/`

The list endpoints consume paginated `data.results`. Join sends an empty body and accepts the
documented `{ status: "pending" }` style response.

## API Architecture

`src/api/services/groups.service.ts` remains a thin API-layer service. It receives `authToken`
explicitly from the feature layer and calls only the centralized endpoint map and `apiClient`.

The API shared types in `src/api/types.ts` define flexible `GroupRecord` and `GroupJoinResult`
shapes using `unknown`-safe records where backend fields may vary.

## Feature Architecture

`src/features/groups/services/groupsService.ts` handles feature-level normalization:

- Safe display name fallback.
- Safe image URL extraction.
- Entity label extraction for university, major, year, semester, and subject fields.
- Membership and permission helpers.
- Safe Arabic API error messages.
- WhatsApp URL detection from known fields and group description.

`src/features/groups/store/groupsStore.ts` uses Zustand for:

- Available groups.
- My groups.
- Selected group detail.
- Loading, refresh, submit, error, success, and count state.
- Join/leave orchestration and post-action reloads.

Screens do not call the API client directly.

## UI Components

Created Groups components:

- `GroupCard`
- `GroupDetailHeader`
- `GroupDescriptionCard`
- `GroupMembershipBadge`
- `GroupPermissionCard`
- `GroupStatsRow`

All components are Arabic-first, RTL-friendly, design-system-driven, and safe with missing
backend fields.

## Navigation

- Home quick action navigates to the Groups tab and `GroupsOverview`.
- Subject details can navigate to the Groups overview for the Groups linked section.
- Subject-specific group filtering was not added because no subject-specific groups endpoint is
  documented in the mobile API collection.
- `ChatRoom` route remains available as a placeholder only.

## WhatsApp Link Handling

WhatsApp support is passive and intentionally narrow:

- Known optional fields are checked first: `whatsapp_url`, `whatsapp_link`,
  `external_chat_url`, and `external_link`.
- The description is scanned only for `https://chat.whatsapp.com/`, `https://wa.me/`, and
  `whatsapp://` links.
- Links are opened only after the user presses the button.
- Invalid or unsupported URLs are not opened.
- The app uses React Native `Linking`; no dependency was added.

## Why Chat Was Not Implemented

The official API collection includes group message endpoints, but Phase 9 explicitly excludes
chat messages, sending, deletion, reporting, typing indicators, and WebSocket. The Group detail
screen therefore shows a coming-soon chat card without calling message APIs.

## Why Group Files Were Not Implemented

Group files belong to the later Files and In-App Viewer foundation. Phase 9 keeps a coming-soon
files card and does not call files endpoints from the Groups module.

## Intentionally Not Implemented

- Chat messages.
- WebSocket.
- Typing indicators.
- Message sending, deletion, or reporting.
- Group files.
- Files module.
- PDF viewer.
- Printing.
- Notifications list.
- Support.
- Dashboard group management.
- Admin/moderator tools.
- Subject-specific group endpoint or filters.
- TanStack Query or new dependencies.

## Security And API Decisions

- Access token is read through the auth store by the feature store only.
- Tokens, API bodies, and user profiles are not logged.
- Backend remains the source of truth for group access and permissions.
- Frontend action visibility is only a UX hint; backend authorization is still required.
- Unknown backend fields are typed as `unknown` and not rendered directly.

## Validation Results

Final Phase 9 validation was run on 2026-06-03:

- `npm run typecheck`: passed
- `npm run lint`: passed
- `npm run format:check`: passed after running `npm run format`
- `npm run expo:config`: passed
- `npm run validate`: passed
- `npm audit`: passed, 0 vulnerabilities
- `npm audit --omit=dev`: passed, 0 vulnerabilities
- `npx expo config --type public`: passed
- `npx expo-doctor`: passed, 21/21 checks
- `npx expo install --check`: passed, dependencies are up to date

No Expo dev server, emulator, Metro server, EAS build, Android build, iOS build, or web server
was started.

## Next Phase Recommendation

Phase 10 should implement Files and In-App Viewer foundation, including subject/group file
entry points and viewer behavior, using only the official API collection.
