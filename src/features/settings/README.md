# settings

Settings feature for account security and static app/legal options.

## Implemented In Phase 14

- Real Settings screen.
- Change Password screen.
- Settings sections and reusable option rows.
- Local validation for change password.
- Arabic success and error states.

## API Scope

Settings uses only:

- `POST /api/v1/auth/change-password/`

The request body contains:

- `old_password`
- `new_password`
- `new_password_confirm`

## Deferred

- Notification preferences API.
- Dark mode persistence.
- Language switching persistence.
- Privacy preferences API.
- Admin/staff settings.

Password drafts stay in memory only and are not logged.
