# printing

Printing feature foundation for creating and tracking student print orders.

## Implemented In Phase 11

- PrintHome entry screen with create/order-list actions.
- CreatePrintOrder screen using accessible files from the Files store.
- Copies control with a 1..99 range.
- Optional user notes.
- MyPrintOrders list screen.
- PrintOrderDetails screen with status, items, notes, backend price display when available, and cancel action.
- PrintPriceSummary review placeholder.
- Future option placeholders for color, duplex, binding, paper size, and pricing.

## API Scope

Phase 11 uses only official API collection endpoints:

- `POST /api/v1/printing/orders/`
- `GET /api/v1/printing/orders/my/`
- `GET /api/v1/printing/orders/{order_id}/`
- `POST /api/v1/printing/orders/{order_id}/cancel/`

Create order sends only:

```json
{
  "items": [{ "source_file": 1, "copies": 1 }],
  "user_notes": "Please print"
}
```

Screens use the Printing store and never call the API client directly.

## Structure

- `components/`: reusable order cards, status badge, file selector, copies stepper, summary, and future options.
- `screens/`: PrintHome, CreatePrintOrder, PrintPriceSummary, MyPrintOrders, and PrintOrderDetails.
- `services/`: feature normalization, status helpers, draft validation, request building, and API orchestration.
- `store/`: Zustand state for orders, selected order, draft, loading, submit, cancel, and errors.
- `types.ts`: flexible printing models using `unknown` for backend fields not yet formalized.

## Deferred

- Printing service/options endpoint.
- Pricing calculation endpoint.
- Payment.
- Upload flow.
- Document picker.
- Pickup location selection.
- Staff/admin printing workflows.

Future option controls are visible placeholders only and are not sent in the Phase 11 request body.
