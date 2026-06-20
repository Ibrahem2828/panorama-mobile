# config

Public runtime configuration for Panorama Mobile.

`env.ts` reads:

- `EXPO_PUBLIC_APP_ENV`
- `EXPO_PUBLIC_API_BASE_URL`
- `EXPO_PUBLIC_WS_BASE_URL`

The API base URL must contain only the origin and must not include `/api/v1`; official endpoint
paths already contain that prefix. The WebSocket base URL is separate because HTTP maps to WS and
HTTPS maps to WSS.

The current VPS/Coolify backend uses temporary HTTP. Development emits safe configuration
warnings, Android cleartext is enabled by `app.config.ts`, and production must move to HTTPS/WSS.
The module exports normalized `env`, `buildApiUrl`, `buildGroupChatWebSocketUrl`, and
`validateClientEnv`. It never logs access tokens or token-bearing WebSocket URLs.

See `docs/33_MOBILE_BACKEND_RUNTIME_INTEGRATION_AND_ASSETS_READINESS.md` for deployment and asset
readiness.
