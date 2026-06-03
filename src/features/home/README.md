# home

Feature foundation for the authenticated Home screen.

## Phase 7 scope

- Fetches relevant announcements from `GET /api/v1/announcements/`.
- Fetches unread notification count from `GET /api/v1/notifications/unread-count/`.
- Uses `useHomeStore` for Home-only state, loading, refresh, and safe errors.
- Renders a student-oriented Home screen with greeting, profile status, announcements, and quick actions.
- Keeps Home as a feature layer. Screens do not call API services directly.

## Files

- `screens/HomeScreen.tsx`: authenticated Home screen.
- `services/homeService.ts`: combines announcements and unread count responses.
- `store/homeStore.ts`: Zustand store for Home data.
- `components/`: presentational Home cards and section header.
- `types.ts`: normalized Home feature types.

## Boundaries

- No TanStack Query is introduced in this phase.
- No WebSocket or push notification listener is introduced in this phase.
- No full notifications inbox is implemented here.
- Quick actions only navigate to existing mounted routes. Shared files remains disabled until its route is mounted.
