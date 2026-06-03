# api

Central API layer for Panorama Mobile.

## Files

- `client.ts`: typed fetch wrapper that unwraps API envelopes and throws `ApiClientError`.
- `endpoints.ts`: centralized `/api/v1/` endpoint map.
- `errors.ts`: safe Arabic error normalization.
- `http.ts`: HTTP method, header, and content-type types.
- `pagination.ts`: pagination types and query helpers.
- `request.ts`: URL, header, and request builder.
- `response.ts`: response envelope types and type guards.
- `types.ts`: shared service record types.
- `services/`: API service foundations per module.
- `index.ts`: public API exports.

## Phase 7 additions

- `announcements.service.ts` exposes `listRelevantAnnouncements(authToken)`.
- Home consumes `announcements.list` and `notifications.unreadCount` through feature services.
- Announcement records are typed in `types.ts` and normalized inside the Home feature.

## Rules

- Do not store tokens in `src/api`.
- Do not use SecureStore or Zustand inside the API layer.
- Do not add automatic refresh interceptors until that phase is explicitly scoped.
- Pass `authToken` explicitly from the feature/auth layer when needed.
- Do not place endpoint strings outside `endpoints.ts`.
- Do not call the API client directly from screens.
