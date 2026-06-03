# Phase 13 Support Tickets Foundation

Phase 13 implements the student-facing support ticket MVP using only the official support API endpoints.

## Implemented

- Student Support Tickets list screen.
- Create Support Ticket screen.
- Ticket Details screen with message history.
- Reply input for tickets that are not closed or resolved.
- Zustand store for tickets, selected ticket, create draft, reply draft, loading states, validation, and safe errors.
- Feature-level normalization helpers for flexible backend support ticket fields.
- ProfileHome entry point to Support Tickets.
- Notification routing foundation for support ticket notifications when safe target metadata exists.

## Official Endpoints Used

- `POST /api/v1/support/tickets/`
- `GET /api/v1/support/tickets/my/`
- `GET /api/v1/support/tickets/{ticket_id}/`
- `POST /api/v1/support/tickets/{ticket_id}/messages/`

## Request Bodies

Create ticket:

```json
{
  "category": "technical",
  "subject": "Issue",
  "message": "Details"
}
```

Add message:

```json
{
  "message": "More details"
}
```

## Boundaries

Not implemented in Phase 13:

- Attachments.
- Category API.
- Close or reopen ticket actions.
- Staff assignment.
- Staff/admin support tools.
- Realtime chat.
- Push notifications.
- New dependencies.
- Invented support endpoints.

Closed or resolved tickets block new student messages in the UI and store before calling the API.

## Structure

- `src/features/support/components/`: ticket card, status badge, category selector, message bubble, message input, and summary card.
- `src/features/support/screens/`: list, create, and detail screens.
- `src/features/support/services/`: feature-level API orchestration and normalization.
- `src/features/support/store/`: Zustand support store.
- `src/features/support/types.ts`: support feature types.
- `src/api/services/support.service.ts`: thin API service over official endpoints.

## Validation

Executed validation commands for Phase 13:

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

No Expo dev server is required for this phase.
