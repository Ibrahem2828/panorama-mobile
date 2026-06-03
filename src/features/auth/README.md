# auth

Authentication feature for Panorama Mobile.

## Implemented

- Real Arabic Login screen.
- Zustand auth store.
- Secure access and refresh token storage through Expo SecureStore.
- Session bootstrap on app launch.
- Login, bootstrap, refresh, and logout orchestration.
- Current user loading through `GET /api/v1/auth/me/`.
- Safe logout that clears local tokens.

## Phase 14 Note

- Profile can refresh and update the current auth user through a minimal `setUser` store action.
- Change Password uses `POST /api/v1/auth/change-password/` through the API auth service.
- Password values are not logged and are not persisted outside the in-memory Settings store draft.
- Logout still clears secure tokens through the existing auth flow, now after Profile confirmation UI.

## Files

- `types.ts`: auth user, token, and session types.
- `components/`: auth form components.
- `services/`: token storage and session orchestration.
- `store/authStore.ts`: Zustand auth session state.
- `screens/LoginScreen.tsx`: login screen connected to the auth store.

## Rules

- Do not use AsyncStorage for tokens.
- Do not log tokens or passwords.
- Do not write direct fetch calls inside screens.
- API service does not use SecureStore or Zustand.
