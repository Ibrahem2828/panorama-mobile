# API services

هذه الملفات هي service foundations فوق `apiClient` وليست features مكتملة.

## المتوفر

- `auth.service.ts`
- `academic.service.ts`
- `verification.service.ts`
- `groups.service.ts`
- `files.service.ts`
- `printing.service.ts`
- `notifications.service.ts`
- `support.service.ts`

## قواعد Phase 5

- يسمح للخدمات باستيراد `apiClient` و`endpoints`.
- لا توجد React hooks هنا.
- لا يوجد token storage داخل API services.
- لا يوجد Zustand أو SecureStore أو TanStack Query داخل API services.
- Auth service يستدعي backend فقط؛ session orchestration موجود داخل `src/features/auth/services`.
- بعض الدوال تقبل `authToken` اختياريا حتى تمرره طبقة Auth.
