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

## Phase 8 additions

- `SubjectRecord` is typed in `types.ts`.
- `academic.service.ts` exposes `listSubjectsForMajor(majorId, params, authToken)`.
- Subjects use `GET /api/v1/majors/{major_id}/subjects/`.
- Supported query params for subjects are `academic_year`, `semester`, `search`, and `ordering`.
- No subject detail endpoint is defined because it is not present in the official API collection.

## Rules

- Do not store tokens in `src/api`.
- Do not use SecureStore or Zustand inside the API layer.
- Do not add automatic refresh interceptors until that phase is explicitly scoped.
- Pass `authToken` explicitly from the feature/auth layer when needed.
- Do not place endpoint strings outside `endpoints.ts`.
- Do not call the API client directly from screens.
