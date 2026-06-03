# Panorama Mobile

Panorama هو تطبيق موبايل عربي وRTL-first للطلاب الجامعيين. الهدف هو جمع المواد، الغروبات، المحادثات، الملفات، طلبات الطباعة، الإشعارات، الدعم الفني، والبيانات الأكاديمية داخل تجربة واحدة منظمة.

## حالة المشروع الحالية

الحالة الحالية: **Phase 6 Student Profile & Verification Foundation**.

تم تنفيذ:

- Expo SDK 56 عبر `expo@~56.0.8`.
- React `19.2.3` وReact Native `0.85`.
- Secure token storage عبر Expo SecureStore.
- Zustand auth store وجلسة تسجيل دخول فعلية.
- API client موحد مع Bearer auth وFormData support.
- Root navigation بين Public وStudentSetup وAppTabs.
- Student academic profile setup.
- Student number parsing.
- Verification submit/status/resubmit foundation.
- Image selection من المعرض عبر `expo-image-picker`.

## ما تم إنجازه

- Phase 0: توثيق الرؤية وقرارات المنتج ونطاق MVP.
- Phase 1: إنشاء مشروع Expo + React Native + TypeScript وبنية `src/`.
- Phase 1.6: إصلاح tooling وExpo config وTypeScript وESLint وPrettier وaudit.
- Phase 2: تأسيس design system reusable.
- Phase 3: تأسيس React Navigation architecture والـ placeholders.
- Phase 4: تأسيس API client وendpoint map وservice foundations.
- Phase 5: تأسيس Authentication Foundation.
- Phase 5.5: تدقيق Expo SDK وترقية المشروع إلى SDK 56.
- Phase 6: تأسيس Student Profile & Verification وتفعيل StudentSetup gate.

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
npx expo config --type public
npx expo-doctor
npx expo install --check
```

لا يتم تشغيل Expo dev server أو emulator أو EAS build ضمن مراحل التنفيذ الآلي إلا إذا طلب المستخدم ذلك صراحة.

## حدود Phase 6

لم يتم تنفيذ:

- Register Student الكامل.
- OTP الكامل.
- Password reset الكامل.
- Home/Subjects/Groups/Files/Printing/Notifications/Support real data.
- TanStack Query.
- WebSocket أو PDF viewer.

الطالب المصادق لا يدخل AppTabs إلا بعد اكتمال الملف الأكاديمي وقبول التوثيق. الأدوار غير `student` تدخل AppTabs مؤقتا إلى حين تحديد قواعدها النهائية.
