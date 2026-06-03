# Phase 11: Printing Foundation

## Goal

Phase 11 turns the Printing tab into an MVP foundation for creating and tracking print orders while
preserving the project rule that services, pricing, and operational options must come from the
backend when those endpoints are available.

## Official API Scope

The official mobile API collection was inspected before implementation. Phase 11 uses only:

- `POST /api/v1/printing/orders/`
- `GET /api/v1/printing/orders/my/`
- `GET /api/v1/printing/orders/{order_id}/`
- `POST /api/v1/printing/orders/{order_id}/cancel/`

No printing services/options, pricing, payment, upload, document picker, pickup location, staff, or
admin endpoint was invented.

## Create Order Contract

CreatePrintOrder sends only the documented body:

```json
{
  "items": [{ "source_file": 1, "copies": 1 }],
  "user_notes": "Please print"
}
```

`user_notes` is omitted when empty. Future options are displayed as disabled/placeholder context and
are never included in the request body.

## API Layer

`src/api/services/printing.service.ts` remains a thin API-layer service over `apiClient` and the
centralized endpoint map.

It exposes:

- `createPrintOrder(request, authToken)`
- `listMyPrintOrders(authToken)`
- `getPrintOrderDetail(orderId, authToken)`
- `cancelPrintOrder(orderId, authToken)`

All auth tokens are passed explicitly from the feature layer. The API layer does not import
Zustand, SecureStore, React hooks, or feature files.

## Feature Layer

`src/features/printing/services/printingService.ts` handles:

- Flexible backend response normalization.
- Arabic-safe API error messages.
- Status label and badge variant mapping.
- Cancellation eligibility.
- Draft validation.
- Official create-request body construction.
- Date and price display helpers.

`src/features/printing/store/printingStore.ts` uses Zustand for:

- My print orders.
- Selected order.
- Create-order draft.
- Draft validation errors.
- Loading, refresh, submit, and cancel flags.
- Error and success messages.

Screens use the store and never call `apiClient` or API services directly.

## Screens

Implemented screens:

- `PrintHome`: entry point, latest order, create/order-list actions.
- `CreatePrintOrder`: accessible file selection, copies 1..99, notes, future option placeholders, summary, submit.
- `PrintPriceSummary`: review placeholder without pricing calculation.
- `MyPrintOrders`: current student's print order list.
- `PrintOrderDetails`: status, items, notes, backend price if present, and cancel action when allowed.

## Files Integration

`FileDetailsScreen` now exposes `طلب طباعة` and navigates to:

- `PrintingTab`
- `CreatePrintOrder`
- Params: `fileId` and `fileTitle`

Files still do not download, share, save to device, upload, or open a document picker.

## Future Options Boundary

The UI shows placeholders for:

- Color.
- Duplex.
- Binding.
- Paper size.
- Pricing.

These are visible readiness placeholders only. They are not sent to the backend in Phase 11 because
the scoped official endpoints do not define those fields.

## Security And Privacy

- Tokens remain in SecureStore/auth state and are passed explicitly to services.
- Tokens, request bodies, file URLs, and user profiles are not logged.
- Backend authorization remains the source of truth for accessible files and print orders.
- The Files feature only supplies already-accessible file ids to Printing.

## Deferred

- Dynamic printing services/options endpoint.
- Pricing calculation endpoint.
- Payment.
- Upload flow.
- Document picker.
- Pickup locations.
- Staff/admin print workflow.
- Push notifications or realtime order updates.

## Validation

Final validation was run on 2026-06-03:

- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm run format:check`: passed.
- `npm run expo:config`: passed.
- `npm run validate`: passed.
- `npm audit`: passed, 0 vulnerabilities.
- `npm audit --omit=dev`: passed, 0 vulnerabilities.
- `npx expo config --type public`: passed.
- `npx expo-doctor`: passed, 21/21 checks.
- `npx expo install --check`: passed, dependencies are up to date.

The Expo dev server was not started.
