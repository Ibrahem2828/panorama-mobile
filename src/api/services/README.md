# API services

هذه الملفات هي service foundations فقط، وليست features مكتملة.

## المتوفر

- `auth.service.ts`
- `academic.service.ts`
- `verification.service.ts`
- `groups.service.ts`
- `files.service.ts`
- `printing.service.ts`
- `notifications.service.ts`
- `support.service.ts`

## القواعد

- يسمح للخدمات باستيراد `apiClient` و`endpoints`.
- لا يتم استيراد الخدمات من الشاشات في Phase 4.
- لا توجد React hooks هنا.
- لا يوجد token storage أو refresh automation.
- لا يوجد Zustand أو SecureStore أو TanStack Query.
- تقبل بعض الدوال `authToken` اختياريا حتى تمرره طبقة Auth لاحقا.
