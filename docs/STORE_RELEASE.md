# Store release checklist (Panorama mobile)

Code-side items are done on branch `release/mobile-store-readiness`. The items below need
credentials or accounts that cannot live in the repository.

## Required before the first store build

- **Sentry**: create a React Native project, then set `EXPO_PUBLIC_SENTRY_DSN` as an EAS secret
  (`eas secret:create`). Without it error reporting stays inert.
- **Android push (FCM)**: add a Firebase project, download `google-services.json`, register it as an
  EAS file secret and reference it from `app.config.ts` (`android.googleServicesFile`). Upload the FCM
  v1 service-account key with `eas credentials`. Without it no push is delivered on Android.
- **iOS**: create the App Store Connect app, then add `ascAppId` to `eas.json > submit.production.ios`
  and upload the APNs key via `eas credentials`.
- **Google Play**: add a service-account key and set `serviceAccountKeyPath` in
  `eas.json > submit.production.android`.
- **Privacy / terms URLs** are set from `EXPO_PUBLIC_PRIVACY_URL` / `EXPO_PUBLIC_TERMS_URL`
  (defaults point at the website). Confirm both pages are live and enter the privacy URL in both stores.
- **Support email**: replace the personal Gmail default with a company-domain mailbox
  (`EXPO_PUBLIC_SUPPORT_EMAIL`).
- Verify icon (1024x1024), adaptive icon (foreground 1024 with safe zone) and splash assets.

## Backend dependencies (must be live)

- `account_deletion_enabled` feature flag ON (in-app account deletion uses `/api/v1/account/deletion/*`).
- OTP email delivery working in production (see backend `EMAIL_*` settings) and `/api/v1/health/ready/` = 200.

## Release flow

1. `npm run validate:release`
2. `eas build --platform all --profile production`
3. Smoke test on a real device: register, receive OTP email, verify, login, delete-account request/cancel.
4. `eas submit`; ship JS-only fixes afterwards with `eas update --channel production`.
