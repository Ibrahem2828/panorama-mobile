# Mobile Backend Runtime Integration and Assets Readiness

## Backend runtime config

| Item               | Current value                                                           |
| ------------------ | ----------------------------------------------------------------------- |
| API base URL       | `http://eby52x8qksscjvfeqxf0eob7.76.13.155.172.sslip.io`                |
| API prefix         | `/api/v1`                                                               |
| Health URL         | `http://eby52x8qksscjvfeqxf0eob7.76.13.155.172.sslip.io/api/v1/health/` |
| WebSocket base URL | `ws://eby52x8qksscjvfeqxf0eob7.76.13.155.172.sslip.io`                  |
| Authorization      | `Authorization: Bearer <ACCESS_TOKEN>`                                  |

The current VPS/Coolify URL uses temporary cleartext HTTP. Android cleartext traffic is enabled
by the Expo config only while the configured API URL starts with `http://`. Production must use
HTTPS, the WebSocket base must move to WSS, and Android cleartext must then resolve to `false`.

## Environment variables

```env
EXPO_PUBLIC_APP_ENV=development
EXPO_PUBLIC_API_BASE_URL=http://eby52x8qksscjvfeqxf0eob7.76.13.155.172.sslip.io
EXPO_PUBLIC_WS_BASE_URL=ws://eby52x8qksscjvfeqxf0eob7.76.13.155.172.sslip.io
```

`EXPO_PUBLIC_API_BASE_URL` must not include `/api/v1`; every official endpoint already includes
that prefix. `EXPO_PUBLIC_WS_BASE_URL` is configured separately because its protocol and route
are different from REST.

## Runtime URL behavior

- `buildApiUrl('/api/v1/auth/login/')` produces the current host plus
  `/api/v1/auth/login/`.
- A mistakenly repeated leading `/api/v1/api/v1/` is normalized to one prefix.
- A configured API base ending in `/api/v1` is normalized back to the host and warned about only
  in development.
- The WebSocket token is encoded with `encodeURIComponent`.
- Access tokens and complete token-bearing WebSocket URLs must never be logged.

## WebSocket contract

Connection path:

```text
/ws/v1/groups/{group_id}/chat/?token={access_token}
```

Current runtime result:

```text
ws://eby52x8qksscjvfeqxf0eob7.76.13.155.172.sslip.io/ws/v1/groups/{group_id}/chat/?token={encoded_access_token}
```

Text payload:

```json
{
  "type": "message",
  "content": "Hello"
}
```

REST remains the stable fallback through:

- `GET /api/v1/groups/{group_id}/messages/`
- `POST /api/v1/groups/{group_id}/messages/`

## Health check

The API layer exposes a non-authenticated health helper using:

```text
GET /api/v1/health/
```

Manual check:

```bash
curl http://eby52x8qksscjvfeqxf0eob7.76.13.155.172.sslip.io/api/v1/health/
```

Verified on June 12, 2026: HTTP `200` with normalized backend status `healthy`.

## Required assets checklist

The repository currently has no `assets/` directory and no image files. All entries below are
therefore missing. No placeholder was generated and `app.config.ts` does not reference a missing
image.

| Filename                       | Recommended folder     | Purpose                                   | Required content                                    | Priority        | Recommended dimensions | Status  |
| ------------------------------ | ---------------------- | ----------------------------------------- | --------------------------------------------------- | --------------- | ---------------------- | ------- |
| `icon.png`                     | `assets/icons/`        | iOS/general app icon                      | Simple Panorama mark with no small text             | MVP             | 1024 x 1024 PNG        | Missing |
| `adaptive-icon.png`            | `assets/icons/`        | Android adaptive icon composite/reference | Mark centered inside Android safe zone              | MVP             | 1024 x 1024 PNG        | Missing |
| `adaptive-icon-foreground.png` | `assets/icons/`        | Android adaptive foreground               | Transparent mark-only foreground                    | MVP             | 1024 x 1024 PNG        | Missing |
| `favicon.png`                  | `assets/icons/`        | Expo web/browser icon                     | Simplified Panorama mark                            | Optional polish | 48 x 48 PNG            | Missing |
| `splash.png`                   | `assets/splash/`       | Launch screen artwork                     | Centered brand mark with generous safe margins      | MVP             | 1284 x 2778 PNG        | Missing |
| `logo-full.png`                | `assets/brand/`        | Full brand lockup                         | Full bilingual Panorama identity                    | Optional polish | At least 1600 px wide  | Missing |
| `logo-horizontal.png`          | `assets/brand/`        | Headers and wide placements               | Horizontal mark and wordmark                        | Optional polish | About 1600 x 500 PNG   | Missing |
| `logo-mark.png`                | `assets/brand/`        | Compact in-app branding                   | Standalone simplified mark                          | MVP             | 1024 x 1024 PNG        | Missing |
| `logo-white.png`               | `assets/brand/`        | Branding on dark backgrounds              | White transparent logo variant                      | Optional polish | At least 1200 px wide  | Missing |
| `logo-dark.png`                | `assets/brand/`        | Branding on light backgrounds             | Dark transparent logo variant                       | Optional polish | At least 1200 px wide  | Missing |
| `onboarding-services.png`      | `assets/onboarding/`   | Services onboarding                       | Student services overview illustration              | Optional polish | 1600 x 1200 PNG        | Missing |
| `onboarding-files.png`         | `assets/onboarding/`   | Files onboarding                          | Academic files illustration                         | Optional polish | 1600 x 1200 PNG        | Missing |
| `onboarding-groups.png`        | `assets/onboarding/`   | Groups onboarding                         | Student group collaboration illustration            | Optional polish | 1600 x 1200 PNG        | Missing |
| `onboarding-printing.png`      | `assets/onboarding/`   | Printing onboarding                       | Document printing workflow illustration             | Optional polish | 1600 x 1200 PNG        | Missing |
| `onboarding-support.png`       | `assets/onboarding/`   | Support onboarding                        | Student help/support illustration                   | Optional polish | 1600 x 1200 PNG        | Missing |
| `empty-notifications.png`      | `assets/empty/`        | Empty notifications state                 | Calm no-notifications illustration                  | Optional polish | 1200 x 900 PNG         | Missing |
| `empty-files.png`              | `assets/empty/`        | Empty files state                         | Empty academic files illustration                   | Optional polish | 1200 x 900 PNG         | Missing |
| `empty-groups.png`             | `assets/empty/`        | Empty groups state                        | No joined/available groups illustration             | Optional polish | 1200 x 900 PNG         | Missing |
| `empty-print-orders.png`       | `assets/empty/`        | Empty printing state                      | No print orders illustration                        | Optional polish | 1200 x 900 PNG         | Missing |
| `empty-support.png`            | `assets/empty/`        | Empty support state                       | No support tickets illustration                     | Optional polish | 1200 x 900 PNG         | Missing |
| `empty-chat.png`               | `assets/empty/`        | Empty chat state                          | New conversation/no messages illustration           | Optional polish | 1200 x 900 PNG         | Missing |
| `empty-subjects.png`           | `assets/empty/`        | Empty subjects state                      | No academic subjects illustration                   | Optional polish | 1200 x 900 PNG         | Missing |
| `network-error.png`            | `assets/errors/`       | Offline/network error state               | Clear disconnected-network illustration             | Optional polish | 1200 x 900 PNG         | Missing |
| `server-error.png`             | `assets/errors/`       | Backend error state                       | Neutral service-unavailable illustration            | Optional polish | 1200 x 900 PNG         | Missing |
| `permission-denied.png`        | `assets/errors/`       | Access denied state                       | Privacy/access restriction illustration             | Optional polish | 1200 x 900 PNG         | Missing |
| `verification-card-guide.png`  | `assets/verification/` | Student card upload guidance              | Legible example showing framing and glare avoidance | MVP             | 1200 x 900 PNG         | Missing |
| `verification-pending.png`     | `assets/verification/` | Pending verification state                | Waiting/review status illustration                  | Optional polish | 800 x 800 PNG          | Missing |
| `verification-approved.png`    | `assets/verification/` | Approved verification state               | Positive approval status illustration               | Optional polish | 800 x 800 PNG          | Missing |
| `verification-rejected.png`    | `assets/verification/` | Rejected verification state               | Clear retry/correction status illustration          | Optional polish | 800 x 800 PNG          | Missing |

The full Panorama logo is not suitable as the app icon because its detailed handshake and
bilingual text will not remain legible at launcher sizes. The icon should use a simplified,
production-quality logo mark with an appropriate safe area.

## Production checklist

- Replace the temporary HTTP API base URL with HTTPS.
- Replace the WS base URL with WSS.
- Confirm Android `usesCleartextTraffic` resolves to `false` after HTTPS is configured.
- Provide and publish the Privacy Policy URL.
- Provide and publish the Terms URL.
- Provide a production support contact.
- Supply production app icon, adaptive icon, splash, and core brand assets.
- Validate final image dimensions, transparency, safe areas, and visual quality on devices.
