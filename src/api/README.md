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
- `services/`: service foundations لكل module.
- `index.ts`: exports عامة.

## قواعد Phase 5

- لا تخزن tokens داخل `src/api`.
- لا تستخدم SecureStore أو Zustand داخل API layer.
- لا تنفذ automatic refresh interceptor لكل endpoints بعد.
- مرر `authToken` صراحة من طبقة auth عند الحاجة.
- لا تضع endpoint strings خارج `endpoints.ts`.
- لا تستدع API مباشرة من الشاشات.
