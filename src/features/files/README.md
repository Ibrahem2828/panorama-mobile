# files

Files feature foundation for accessible student files and in-app viewing.

## Implemented In Phase 10

- Real Files list screen.
- Real File details screen.
- Real Group files screen.
- In-app viewer foundation.
- Image rendering inside the app with React Native `Image`.
- Safe in-app fallback for PDF, document, unknown, and missing-URL files.
- File metadata display.
- Loading, refresh, error, and empty states.
- Printing request entry point from file details, added in Phase 11.

## Structure

- `components/`: reusable Files UI components and viewer pieces.
- `screens/`: files list, file detail, group files, and generic viewer screens.
- `services/`: feature-level normalization, viewer helpers, metadata helpers, and API orchestration.
- `store/`: Zustand state for accessible files, group files, selected file, loading, refresh, and errors.
- `types.ts`: flexible typed file models using `unknown` for unknown backend fields.

## API Scope

Phase 10 uses only official API collection endpoints:

- `GET /api/v1/files/`
- `GET /api/v1/files/{file_id}/`
- `GET /api/v1/groups/{group_id}/files/`

Screens use the Files store and never call the API client directly.

## Phase 11 Printing Link

File details exposes `طلب طباعة` and navigates to the Printing stack with the selected file id and
display title. Files still do not upload, download, share, save to device, or open a document
picker. The Printing feature owns order creation and sends only the official printing request body.

## Viewer Scope

The viewer opens files inside the app. Images render directly. PDF and document rendering shows a
clear in-app fallback until a runtime-tested advanced viewer is added.

No `react-native-webview` dependency was installed in Phase 10.

## No-Download Rule

There is no direct download button, share button, save-to-device action, document picker, or
filesystem integration. If the backend returns a `download_url` field, the UI still does not
expose download behavior.

This is a UI/product decision and not a DRM guarantee. Backend authorization remains the source
of truth for file visibility.

## Deferred

- Advanced PDF rendering.
- Dynamic printing options.
- Subject-specific files endpoint.
- File download/share/save-to-device actions.
- Chat, WebSocket, notifications list, and support.
