# Phase 5 Authentication Foundation

## الهدف

تنفيذ أساس المصادقة في تطبيق Panorama Mobile بدون توسيع نطاق المنتج خارج تسجيل الدخول وإدارة الجلسة.

هذه المرحلة تضيف:

- تخزين آمن للتوكنات.
- حالة مصادقة عامة عبر Zustand.
- bootstrap للجلسة عند تشغيل التطبيق.
- تسجيل دخول حقيقي من شاشة Login.
- تحميل المستخدم الحالي من `/api/v1/auth/me/`.
- تجديد access token مرة واحدة عند الحاجة.
- تسجيل خروج يمسح التوكنات المحلية دائما.
- تبديل Root navigation حسب حالة المصادقة.

## الاعتماديات المثبتة

- `expo-secure-store`: لتخزين access token وrefresh token بأمان.
- `zustand`: لإدارة حالة المصادقة الخفيفة.

لم تتم إضافة Redux أو TanStack Query أو React Hook Form أو Zod في هذه المرحلة.

## استراتيجية تخزين التوكنات

ملف التخزين:

```txt
src/features/auth/services/authTokenStorage.ts
```

التخزين يستخدم Expo SecureStore فقط عبر المفاتيح:

- `panorama.auth.accessToken`
- `panorama.auth.refreshToken`

لا يتم استخدام AsyncStorage للتوكنات. عند وجود توكن ناقص، يتم مسح التخزين المحلي وإرجاع `null`.

## استراتيجية Auth Store

ملف الحالة:

```txt
src/features/auth/store/authStore.ts
```

الحالة تشمل:

- `status`
- `user`
- `accessToken`
- `refreshToken`
- `isBootstrapping`
- `isSubmitting`
- `errorMessage`

الـ store لا يتعامل مع SecureStore مباشرة. كل التخزين والتنسيق يمر عبر `authSessionService`.

## سلوك Bootstrap

ملف تنسيق الجلسة:

```txt
src/features/auth/services/authSessionService.ts
```

السلوك:

1. قراءة التوكنات من SecureStore.
2. إذا لم توجد توكنات، الحالة تصبح unauthenticated.
3. إذا وجد access token، يتم تحميل المستخدم الحالي من `/api/v1/auth/me/`.
4. إذا فشل الطلب بـ 401، يتم refresh للـ access token مرة واحدة.
5. بعد نجاح refresh، يتم حفظ access token الجديد وإعادة تحميل المستخدم مرة واحدة.
6. إذا فشل refresh، يتم مسح التوكنات والعودة إلى Public flow.

لا توجد حلقة refresh لا نهائية.

## تسجيل الدخول

شاشة:

```txt
src/features/auth/screens/LoginScreen.tsx
```

تستخدم شاشة Login controlled inputs بسيطة للـ identifier/password مع validation محلي:

- identifier مطلوب.
- password مطلوب.

لا يوجد direct fetch داخل الشاشة.

## تسجيل الخروج

تمت إضافة زر خروج في:

```txt
src/features/profile/screens/ProfileHomeScreen.tsx
```

السلوك:

- إذا وجد refresh token، يتم استدعاء logout في الباك إند.
- يتم مسح SecureStore دائما حتى لو فشل logout في الباك إند.
- يتم مسح user والتوكنات من Zustand.

## Refresh Access Token

`refreshAccessToken` موجود في auth store ويقرأ refresh token من SecureStore عبر session service، ثم يستدعي:

```txt
POST /api/v1/auth/token/refresh/
```

بعد نجاح refresh يتم حفظ access token الجديد مع refresh token الحالي.

## دمج Navigation

تم تحديث:

```txt
src/navigation/RootNavigator.tsx
src/navigation/config/initialFlow.ts
src/navigation/guards/navigationGuards.ts
```

السلوك الحالي:

- أثناء bootstrap تظهر `AuthBootstrapScreen`.
- المستخدم غير المصادق يرى Public flow.
- المستخدم المصادق يرى AppTabs.
- StudentSetupNavigator ما زال موجودا لكنه غير مفعل حتى مرحلة Student Profile & Verification.

## ما لم يتم تنفيذه عمدا

- Student Profile setup.
- Student verification.
- OTP flow الكامل.
- Register Student flow الإنتاجي.
- Password reset flow الإنتاجي.
- Role-based dashboards.
- Home real data.
- Subjects/Groups/Files/Printing/Notifications/Support feature logic.
- WebSocket أو chat.
- PDF viewer.
- TanStack Query.
- Automatic auth interceptor لكل API calls.

## ملاحظات أمنية

- لا يتم تسجيل access token أو refresh token أو password في logs.
- التوكنات لا تخزن في AsyncStorage.
- API layer لا يعرف SecureStore ولا Zustand.
- الأخطاء المعروضة للمستخدم عربية وآمنة ولا تعرض stack traces.
- Refresh يتم مرة واحدة فقط في bootstrap.

## التحقق

آخر أوامر تحقق بعد Phase 5:

- `npm run typecheck`: نجح.
- `npm run lint`: نجح.
- `npm run format:check`: نجح.
- `npm run expo:config`: نجح.
- `npm run validate`: نجح.
- `npm audit`: نجح، 0 vulnerabilities.
- `npm audit --omit=dev`: نجح، 0 production vulnerabilities.

لم يتم تشغيل Expo dev server أو Metro أو emulator أو EAS build.

## توصية المرحلة التالية

المشروع جاهز للانتقال إلى Phase 6 Student Profile & Verification Foundation، مع تفعيل StudentSetup guard لاحقا بناء على بيانات المستخدم وحالة الملف الأكاديمي والتوثيق القادمة من الباك إند.

## ملاحظة Phase 5.5

بعد Phase 5 تم إدخال Phase 5.5 لتدقيق جاهزية Expo SDK قبل Phase 6. أظهر التدقيق أن SDK 46 كان مثبتا فعليا وغير مناسب للإنتاج الحديث، وتمت ترقية المشروع إلى Expo SDK 56 وتوثيق ذلك في `20_PHASE_5_5_EXPO_SDK_AUDIT_AND_UPGRADE.md`.
