# profile

Profile feature foundation for the current user's account area.

## Current Scope

- Shows basic current-user identity.
- Supports logout through the auth store.
- Exposes an action to open the in-app Notifications screen.
- Exposes an action to open the student Support Tickets screen.
- Keeps settings/profile expansion for later phases.

## Phase 12 Note

Notifications remain mounted under the Profile stack. ProfileHome links to `ProfileRoutes.Notifications`
so the notifications inbox is reachable from both Home quick actions and the Profile area.

## Phase 13 Note

Support Tickets remain mounted under the Profile stack. ProfileHome links to `ProfileRoutes.SupportTickets`
so students can create and follow their support tickets from the account area.
