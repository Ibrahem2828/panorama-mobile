# profile

Profile and account area for the current user.

## Implemented In Phase 14

- Real Profile Home screen.
- Edit Profile screen.
- Academic Info screen.
- Privacy Policy screen.
- Terms screen.
- About screen.
- Profile summary card.
- Academic summary and display-only academic information.
- Account action sections for notifications, support, printing orders, academic info, settings, and legal screens.
- Logout confirmation before calling the auth logout flow.

## API Scope

Profile uses only official account endpoints:

- `GET /api/v1/auth/me/`
- `PATCH /api/v1/auth/me/`

Academic Info reads through existing student-profile and verification stores:

- `GET /api/v1/students/me/profile/`
- `GET /api/v1/verification/me/`

## Edit Profile Rules

Only `full_name` and `username` are editable and sent to the backend.

Read-only in this phase:

- Email.
- Phone.
- Role.
- Academic identity fields.

## Deferred

- Delete account.
- Profile photo upload.
- Email or phone editing.
- Role editing.
- User preferences API.
- Privacy settings API.
