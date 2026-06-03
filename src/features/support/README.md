# support

Student-facing Support Tickets foundation for Panorama Mobile.

## Implemented In Phase 13

- Support Tickets list screen.
- Create Support Ticket screen.
- Ticket Details screen.
- Message history display.
- Add-message input for tickets that are not closed or resolved.
- Local category selector for MVP categories.
- Zustand support store for list/detail/create/reply flows.
- Safe Arabic error handling through feature services.

## API Scope

Phase 13 uses only official support endpoints:

- `POST /api/v1/support/tickets/`
- `GET /api/v1/support/tickets/my/`
- `GET /api/v1/support/tickets/{ticket_id}/`
- `POST /api/v1/support/tickets/{ticket_id}/messages/`

Create ticket sends only `category`, `subject`, and `message`.
Add message sends only `message`.

## Structure

- `components/`: ticket card, status badge, category selector, message bubble, message input, and summary card.
- `screens/`: list, create, and detail screens.
- `services/`: normalization, labels, permissions, and API orchestration.
- `store/`: Zustand support store.
- `types.ts`: support feature types.

## Deferred

- Attachments.
- Category API.
- Close or reopen actions.
- Staff assignment.
- Staff/admin tools.
- Realtime chat.
- Push notifications.
- New dependencies.
