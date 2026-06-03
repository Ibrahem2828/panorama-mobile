# Panorama Mobile

Panorama is an Arabic, RTL-first mobile app for university students. The goal is to bring subjects, groups, chats, files, printing requests, notifications, support, and academic data into one organized experience.

## Current Project Status

Current status: **Phase 13 Support Tickets Foundation**.

Implemented so far:

- Expo SDK 56 through `expo@~56.0.8`.
- React `19.2.3` and React Native `0.85`.
- Secure token storage through Expo SecureStore.
- Zustand auth store and real login session foundation.
- Central API client with Bearer auth and FormData support.
- Root navigation between Public, StudentSetup, and AppTabs.
- Student academic profile setup.
- Student number parsing.
- Verification submit/status/resubmit foundation.
- Image selection from gallery through `expo-image-picker`.
- Authenticated Home screen foundation.
- Announcements integration through `GET /api/v1/announcements/`.
- Unread notification count integration through `GET /api/v1/notifications/unread-count/`.
- Real Subjects list through `GET /api/v1/majors/{major_id}/subjects/`.
- Subject detail foundation derived from loaded subject list data.
- Local subjects search by name, title, or code.
- Real Groups overview, Available Groups, My Groups, and Group details.
- Groups integration through `GET /api/v1/groups/available/`, `GET /api/v1/groups/my/`, and `GET /api/v1/groups/{group_id}/`.
- Join/leave group actions through the official Groups API endpoints.
- Passive WhatsApp link support for safe WhatsApp URLs returned by the backend or present in group descriptions.
- Real Files list through `GET /api/v1/files/`.
- Real File detail through `GET /api/v1/files/{file_id}/`.
- Real Group files through `GET /api/v1/groups/{group_id}/files/`.
- In-app viewer foundation for images with safe fallbacks for PDF/document/unknown file types.
- No direct download, share, save-to-device, or external browser action for student files.
- Production audit triage for Expo transitive tooling dependencies, with Expo SDK 56 preserved.
- Printing order creation through `POST /api/v1/printing/orders/`.
- My printing orders through `GET /api/v1/printing/orders/my/`.
- Printing order details and cancel through the official order endpoints.
- File details now route `طلب طباعة` into the Printing stack with file id and title.
- In-app notifications list through `GET /api/v1/notifications/`.
- Mark notification read and mark all notifications read through the official Notifications API.
- Device token service functions exist for future push integration, but are not called at runtime.
- Student support tickets through the official Support Tickets API.
- Create ticket, list my tickets, ticket detail, and add-message support flows.
- ProfileHome links to Support Tickets.
- Support-ticket notifications can route to TicketDetails when safe target metadata exists.

## Completed Phases

- Phase 0: Vision, product decisions, and MVP scope documentation.
- Phase 1: Expo + React Native + TypeScript project initialization and `src/` structure.
- Phase 1.6: Tooling, Expo config, TypeScript, ESLint, Prettier, and audit fixes.
- Phase 2: Reusable design system foundation.
- Phase 3: React Navigation architecture and placeholders.
- Phase 4: API client, endpoint map, and service foundations.
- Phase 5: Authentication Foundation.
- Phase 5.5: Expo SDK audit and upgrade to SDK 56.
- Phase 6: Student Profile & Verification Foundation and StudentSetup gate activation.
- Phase 7: Home screen, announcements, unread notification count, Home store, and Home documentation.
- Phase 8: Subjects list, academic profile filtering, local search, and subject detail foundation.
- Phase 9: Groups overview, lists, detail, membership status, join/leave, and passive WhatsApp support.
- Phase 10: Files list/detail, group files, metadata display, and in-app viewer foundation.
- Phase 10.5: Production audit triage for Expo transitive `uuid`/`xcode` tooling path.
- Phase 11: Printing order MVP foundation using official printing order endpoints.
- Phase 12: In-app notifications list, unread count, read state, and routing foundation.
- Phase 13: Student-facing support tickets list, create, detail, and reply foundation.

## Environment

Only public, non-secret values are documented in `.env.example`:

```bash
EXPO_PUBLIC_APP_ENV=development
EXPO_PUBLIC_API_BASE_URL=http://localhost:8000
EXPO_PUBLIC_WS_BASE_URL=ws://localhost:8000
```

No secrets or tokens belong in env files. Tokens are stored through SecureStore and are not stored in AsyncStorage.

## Validation Commands

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

Expo dev server, emulator commands, and EAS builds are not run during automated phase implementation unless explicitly requested.

## Phase 10 Boundaries

Not implemented in Phase 10:

- Register Student full flow.
- Full OTP flow.
- Full password reset flow.
- Chat messages, message sending, WebSocket, typing indicators, message deletion, and message reporting.
- Advanced PDF rendering and annotations.
- Direct file download, share, save-to-device, document picker, filesystem library, or external browser opening by default.
- Printing order creation and dynamic printing options.
- Support, full notifications list, dashboard group management, and admin/moderator tools.
- Subject detail API endpoint because it is not in the official API collection.
- Subject-specific files endpoint because it is not in the official API collection.
- TanStack Query.
- WebSocket or push notification listeners.

Files list/detail and group files are real. The in-app viewer foundation exists. No direct download button exists. Printing order creation, order listing, order detail, and cancel foundation are real. Advanced PDF rendering may need additional runtime-tested improvement.

## Phase 10.5 Audit Decision

`npm audit` and `npm audit --omit=dev` are currently clean. The inspected `uuid@7.0.3` path is transitive through `expo@56.0.8 -> @expo/config-plugins@56.0.8 -> xcode@3.0.1 -> uuid@7.0.3` and belongs to Expo tooling, not app runtime code. No override or `npm audit fix --force` was applied.

## Phase 11 Printing Boundaries

Implemented in Phase 11:

- PrintHome, CreatePrintOrder, PrintPriceSummary, MyPrintOrders, and PrintOrderDetails are real screens.
- Create order sends only `items[{ source_file, copies }]` and optional `user_notes`.
- Order list, details, and cancel use only the documented printing order endpoints.
- Future color, duplex, binding, paper size, and pricing controls are visible placeholders only and are not sent to the backend.

Not implemented in Phase 11:

- Dynamic printing services/options APIs.
- Pricing calculation endpoint.
- Payment, upload, document picker, pickup location selection, or staff/admin printing workflows.

## Phase 12 Notifications Boundaries

Implemented in Phase 12:

- Notifications screen loads the current user's notifications.
- Unread count loads from the official unread-count endpoint.
- One notification can be marked as read.
- All notifications can be marked as read.
- Read/unread state is shown visually.
- Safe routing foundation handles printing orders, groups, and files when target metadata exists.

Not implemented in Phase 12:

- Push notifications.
- Expo notification permissions.
- FCM/APNs.
- Device token registration at runtime.
- Notification settings or notification detail endpoint.

## Phase 13 Support Tickets Boundaries

Implemented in Phase 13:

- Support Tickets list loads the current student's tickets from `GET /api/v1/support/tickets/my/`.
- Create Support Ticket sends only `category`, `subject`, and `message` to `POST /api/v1/support/tickets/`.
- Ticket Details loads from `GET /api/v1/support/tickets/{ticket_id}/`.
- Add Message sends only `message` to `POST /api/v1/support/tickets/{ticket_id}/messages/`.
- Closed or resolved tickets block new student messages.
- ProfileHome links to the support tickets area.
- Notification routing can open TicketDetails for support ticket metadata with a valid target id.

Not implemented in Phase 13:

- Attachments, category API, close/reopen, staff assignment, staff/admin tools, realtime chat, push notifications, new dependencies, or invented support endpoints.

Authenticated students enter AppTabs only after academic profile completion and verification approval. Non-student roles temporarily enter AppTabs until their final rules are scoped.
