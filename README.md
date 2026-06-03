# Panorama Mobile

Panorama is an Arabic, RTL-first mobile app for university students. The goal is to bring subjects, groups, chats, files, printing requests, notifications, support, and academic data into one organized experience.

## Current Project Status

Current status: **Phase 8 Subjects & Academic Content Foundation**.

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

## Phase 8 Boundaries

Not implemented in Phase 8:

- Register Student full flow.
- Full OTP flow.
- Full password reset flow.
- Files, groups, chat, PDF viewer, support, and notifications list.
- Subject detail API endpoint because it is not in the official API collection.
- Full notifications inbox.
- TanStack Query.
- WebSocket or push notification listeners.

Authenticated students enter AppTabs only after academic profile completion and verification approval. Non-student roles temporarily enter AppTabs until their final rules are scoped.
