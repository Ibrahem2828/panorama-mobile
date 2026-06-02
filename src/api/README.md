# api

طبقة API المركزية لتطبيق Panorama Mobile.

## الملفات

- `client.ts`: fetch wrapper typed يعيد `data` من envelope ويرمي `ApiClientError`.
- `endpoints.ts`: كل مسارات `/api/v1/` المركزية.
- `errors.ts`: error normalization برسائل عربية آمنة.
- `http.ts`: HTTP method/header/content-type types.
- `pagination.ts`: pagination types وquery helpers.
- `request.ts`: URL/header/request builder.
- `response.ts`: response envelope types وtype guards.
- `types.ts`: أنواع مشتركة مبدئية للخدمات.
- `services/`: foundations مستقبلية لكل module.
- `index.ts`: exports عامة.

## القواعد

- لا تستدع API من placeholder screens في Phase 4.
- لا تخزن tokens هنا.
- لا تنفذ refresh-token automation هنا.
- لا تضف TanStack Query أو Zustand أو SecureStore في هذه المرحلة.
- لا تضع endpoint strings خارج `endpoints.ts`.
