# Phase 10: Files & In-App Viewer Foundation

## Goal

Phase 10 makes the Files module useful while preserving the product rule that students open files
inside the app without a direct download button.

Implemented foundations:

- Real accessible Files list.
- Real File detail screen.
- Real Group files screen.
- In-app viewer foundation.
- File cards and metadata display.
- Loading, refresh, error, and empty states.
- Printing request entry point as a disabled placeholder only.

## Source Of Truth

The official mobile API collection in the project root was inspected before implementation.
Only documented file endpoints were used. No download, stream, signed URL, subject files, or
printing order endpoint was invented.

## Endpoints Used

- `GET /api/v1/files/`
- `GET /api/v1/files/{file_id}/`
- `GET /api/v1/groups/{group_id}/files/`

The list endpoints consume paginated `data.results`. File visibility and authorization remain
backend-controlled.

## API Architecture

`src/api/services/files.service.ts` remains a thin API-layer service over `apiClient` and the
central endpoint map. It receives `authToken` explicitly from the feature layer.

`src/api/types.ts` now defines a flexible `FileRecord` shape for known and optional backend
fields using `unknown`-safe records where needed.

## Feature Architecture

`src/features/files/services/filesService.ts` handles:

- File normalization.
- Safe display title and description extraction.
- Safe view URL extraction from `file`, `file_url`, or `url`.
- File viewer type detection.
- File size formatting.
- Extension and visibility labels.
- Arabic-safe API error messages.

`src/features/files/store/filesStore.ts` uses Zustand for:

- All accessible files.
- Group files by group id.
- Selected file detail.
- Loading, refresh, error, count, and last-loaded state.

Screens use the Files store and never call the API client directly.

## UI Components

Created Files components:

- `FileCard`
- `FileDetailHeader`
- `FileMetaRow`
- `FileTypeBadge`
- `InAppFileViewer`
- `FileViewerFallback`

All components are Arabic-first, RTL-friendly, design-system-driven, and safe with missing
backend fields.

## In-App Viewer Behavior

The viewer foundation is intentionally minimal:

- Images are rendered inside the app with React Native `Image`.
- Authorization headers are passed to image requests when an auth token exists.
- PDFs and documents show an in-app fallback message because advanced PDF rendering is deferred.
- Unknown or missing-URL files show an in-app fallback message.
- The app does not open an external browser automatically.

## WebView Decision

`react-native-webview` was not installed in Phase 10. The current phase does not require advanced
PDF rendering, and avoiding a new dependency keeps the Expo managed workflow lighter. Future
runtime testing may justify adding WebView or another viewer in a dedicated improvement phase.

## No-Download UI Decision

No direct download button, share button, save-to-device action, filesystem library, or document
picker was added. The backend may return a `download_url` field, but the Phase 10 UI does not
expose download semantics and does not use it as an action.

This is a product/UI rule, not a DRM guarantee. The frontend cannot guarantee screenshot
prevention or absolute file protection; backend authorization remains the source of truth.

## Navigation

- Home quick action now opens `FilesList` in the Home stack.
- Group details opens `GroupFiles` in the Groups stack.
- Group files can open File details and the in-app viewer.
- Subject details opens the general Files list because the official API collection does not define
  a subject-specific files endpoint.

## Why No Subject Files Endpoint Was Invented

The official mobile API collection includes only general files, file detail, and group files.
Subject-specific file listing was therefore not implemented or simulated.

## Why Printing Was Not Implemented

Printing order creation belongs to the later Printing Foundation. Phase 10 shows a disabled
`طلب طباعة - قريبا` entry point and does not call `POST /api/v1/printing/orders/`.

## Intentionally Not Implemented

- Actual print order creation.
- Dynamic printing options.
- Advanced PDF rendering.
- File download, share, save-to-device, or external browser opening by default.
- Subject-specific files endpoint.
- File streaming or signed URL endpoint.
- Chat, message APIs, or WebSocket.
- Notifications list.
- Support.
- TanStack Query or new dependencies.

## Security And Privacy Decisions

- Access token is read through the auth store by the feature/viewer layer only.
- Tokens, file URLs, API bodies, and user profiles are not logged.
- Backend remains the source of truth for file visibility and authorization.
- Unknown backend fields are typed as `unknown` and not rendered directly.
- No file is saved to device by the app.

## Validation Results

Final Phase 10 validation was run on 2026-06-03:

- `npm run typecheck`: passed
- `npm run lint`: passed
- `npm run format:check`: passed after running `npm run format`
- `npm run expo:config`: passed
- `npm run validate`: passed
- `npm audit`: passed, 0 vulnerabilities
- `npm audit --omit=dev`: passed, 0 vulnerabilities
- `npx expo config --type public`: passed
- `npx expo-doctor`: blocked by sandbox npm cache/registry access; external rerun was blocked by the session usage limit
- `npx expo install --check`: blocked by sandbox network/proxy access; external rerun was blocked by the session usage limit

No Expo dev server, emulator, Metro server, EAS build, Android build, iOS build, or web server
was started.

## Next Phase Recommendation

Phase 10.5 was introduced after this phase to triage production audit findings around Expo
transitive tooling dependencies before starting Printing.

Phase 11 should implement Printing Foundation using the official printing endpoints and dynamic
backend-controlled printing options.
