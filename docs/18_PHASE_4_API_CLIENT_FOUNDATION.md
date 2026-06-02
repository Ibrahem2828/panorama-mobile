# Phase 4 API Client Foundation

## الهدف

تأسيس طبقة API قوية ومكتوبة بـ TypeScript لتطبيق Panorama Mobile، مع احترام response envelope الخاص بالباك إند وبدون تنفيذ Auth أو ربط الشاشات بالـ API.

## النهج المختار

تم استخدام native `fetch` مع wrapper typed بدلا من `axios`.

الأسباب:

- لا حاجة لاعتماديات إضافية في هذه المرحلة.
- التحكم الكامل في envelope parsing.
- دعم timeout وFormData وBearer token الاختياري بشكل مباشر.
- إبقاء الطبقة خفيفة وجاهزة لتكامل TanStack Query لاحقا.

## بنية المجلد

```txt
src/api/
├── client.ts
├── endpoints.ts
├── errors.ts
├── http.ts
├── pagination.ts
├── request.ts
├── response.ts
├── types.ts
├── services/
└── index.ts
```

## Response Envelope

الـ client يتوقع response envelope بالشكل:

```ts
{
  success: boolean;
  message?: string;
  data?: unknown;
  errors?: unknown;
}
```

عند `success: true` يتم إرجاع `data` فقط:

```ts
const user = await apiClient.get<CurrentUser>(endpoints.auth.me);
```

عند `success: false` أو status غير ناجح يتم رمي `ApiClientError` normalized.

## Error Normalization

`src/api/errors.ts` يحتوي:

- `ApiErrorCode`
- `NormalizedApiError`
- `ApiClientError`
- `normalizeApiError`
- `normalizeHttpError`
- `getApiErrorMessage`

الرسائل الافتراضية عربية ومناسبة للمستخدم، ولا يتم تسريب tokens أو request bodies في logs.

## Pagination

`src/api/pagination.ts` يحتوي:

- `PaginatedResult<TItem>`
- `PaginationParams`
- `buildQueryString`
- `toPaginationQuery`

تم استخدام `page_size` في query لأنه النمط المتوقع غالبا للباك إند.

## Endpoint Map

كل endpoints مركزية في:

```txt
src/api/endpoints.ts
```

الـ prefix المعتمد:

```ts
export const API_PREFIX = '/api/v1';
```

لا يجب وضع endpoint strings داخل الشاشات أو الخدمات خارج هذا الملف.

## Service Foundations

تمت إضافة service foundations:

- `auth.service.ts`
- `academic.service.ts`
- `verification.service.ts`
- `groups.service.ts`
- `files.service.ts`
- `printing.service.ts`
- `notifications.service.ts`
- `support.service.ts`

هذه الخدمات لا تستخدم React hooks ولا يتم استدعاؤها من الشاشات حاليا.

## Auth Token Decision

يدعم `apiClient` تمرير `authToken` اختياريا:

```ts
apiClient.get('/api/v1/auth/me/', { authToken });
```

لكن Phase 4 لا يقرأ tokens من storage ولا ينفذ refresh automation. تخزين access/refresh tokens وتجديدها مؤجل إلى Phase Authentication.

## Environment

`src/config/env.ts` يقرأ:

- `EXPO_PUBLIC_APP_ENV`
- `EXPO_PUBLIC_API_BASE_URL`
- `EXPO_PUBLIC_WS_BASE_URL`

ويصدر:

- `env`
- `validateClientEnv`

لا يتم إيقاف تشغيل التطبيق عند نقص القيم لأن الباك إند قد لا يكون يعمل محليا أثناء التطوير.

## ما لم يتم تنفيذه عمدا

- لا يوجد Auth UI.
- لا يوجد auth state.
- لا يوجد SecureStore.
- لا يوجد Zustand.
- لا يوجد TanStack Query.
- لا يوجد refresh-token automation.
- لا توجد API calls من الشاشات أو navigators.
- لا يوجد WebSocket.
- لا يوجد PDF viewer.
- لا يوجد printing pricing logic.
- لم يتم تشغيل Expo dev server أو Metro أو emulator أو EAS build.

## التحقق

آخر تشغيل محلي بعد تنفيذ Phase 4:

- `npm run typecheck`: نجح.
- `npm run lint`: نجح.
- `npm run format:check`: نجح بعد تشغيل `npm run format`.
- `npm run expo:config`: نجح، ويعرض defaults المحلية لـ API وWebSocket.
- `npm run validate`: نجح، ويشمل typecheck وlint وformat:check وexpo:config.
- `npm audit`: نجح، 0 vulnerabilities.
- `npm audit --omit=dev`: نجح، 0 production vulnerabilities.
- لم يتم تشغيل Expo dev server أو Metro أو emulator أو EAS build ضمن Phase 4.

## استخدام API في المراحل القادمة

- استخدم endpoint من `endpoints.ts`.
- استخدم service module المناسب.
- مرر `authToken` من Auth layer لاحقا.
- اربط الخدمات بـ TanStack Query فقط عندما تبدأ مرحلة server state.
- لا تستورد `fetch` مباشرة داخل features.
- لا تكرر endpoint strings داخل الشاشات.
