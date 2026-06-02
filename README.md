# Panorama Mobile

Panorama هو تطبيق موبايل عربي وRTL-first للطلاب الجامعيين. الهدف هو جمع المواد، الغروبات، المحادثات، الملفات، طلبات الطباعة، الإشعارات، الدعم الفني، والبيانات الأكاديمية داخل تجربة واحدة منظمة.

## حالة المشروع الحالية

الحالة الحالية: **Phase 5.5 Expo SDK Audit & Safe Upgrade Decision**.

تم تأسيس طبقة المصادقة الأساسية:

- Secure token storage عبر Expo SecureStore.
- Zustand auth store.
- Session bootstrap عند تشغيل التطبيق.
- Login UI فعلي باللغة العربية.
- تحميل المستخدم الحالي من `/api/v1/auth/me/`.
- Refresh access token مرة واحدة عند انتهاء الجلسة أثناء bootstrap.
- Logout من شاشة Profile.
- Root navigation يتحول بين Public وAppTabs حسب auth state.

## ما تم إنجازه

- Phase 0: توثيق الرؤية وقرارات المنتج ونطاق MVP.
- Phase 1: إنشاء مشروع Expo + React Native + TypeScript وبنية `src/`.
- Phase 1.6: إصلاح tooling وExpo config وTypeScript وESLint وPrettier وaudit.
- Phase 2: تأسيس design system reusable.
- Phase 3: تأسيس React Navigation architecture والـ placeholders.
- Phase 4: تأسيس API client وendpoint map وservice foundations.
- Phase 5: تأسيس Authentication Foundation.
- Phase 5.5: تدقيق Expo SDK وترقية المشروع إلى SDK 56.

## حالة Expo SDK

- Expo SDK الحالي: `56.0.0` عبر `expo@~56.0.8`.
- React: `19.2.3`.
- React Native: `0.85`.
- Expo doctor: نظيف.
- Expo install check: نظيف.

## إعدادات البيئة

القيم العامة فقط موجودة في `.env.example`:

```bash
EXPO_PUBLIC_APP_ENV=development
EXPO_PUBLIC_API_BASE_URL=http://localhost:8000
EXPO_PUBLIC_WS_BASE_URL=ws://localhost:8000
```

لا توجد أسرار أو tokens داخل env. التوكنات تخزن عبر SecureStore ولا تستخدم AsyncStorage.

## أوامر التحقق

```bash
npm run typecheck
npm run lint
npm run format:check
npm run expo:config
npm run validate
npm audit
npm audit --omit=dev
```

لا يتم تشغيل Expo dev server ضمن مراحل التنفيذ الآلي إلا إذا طلب المستخدم ذلك صراحة.

## حدود Phase 5

لم يتم تنفيذ:

- Register Student الكامل.
- OTP الكامل.
- Password reset الكامل.
- Student profile setup.
- Student verification.
- Home/Subjects/Groups/Files/Printing/Notifications/Support real data.
- TanStack Query.
- WebSocket أو PDF viewer.

المستخدم المصادق ينتقل حاليا إلى AppTabs. سيتم تفعيل StudentSetup guard في مرحلة Student Profile & Verification.

## المرحلة التالية

المرحلة التالية المقترحة: **Phase 6 Student Profile & Verification Foundation**.
