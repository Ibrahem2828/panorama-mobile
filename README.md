# Panorama Mobile

Panorama is an Arabic, RTL-first mobile app for university students. The goal is to bring subjects, groups, chats, files, printing requests, notifications, support, and academic data into one organized experience.

## Current Project Status

Current status: **Phase 10 Files & In-App Viewer Foundation**.

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

Files list/detail and group files are real. The in-app viewer foundation exists. No direct download button exists. Printing remains for a later phase, and advanced PDF rendering may need additional runtime-tested improvement.

Authenticated students enter AppTabs only after academic profile completion and verification approval. Non-student roles temporarily enter AppTabs until their final rules are scoped.
