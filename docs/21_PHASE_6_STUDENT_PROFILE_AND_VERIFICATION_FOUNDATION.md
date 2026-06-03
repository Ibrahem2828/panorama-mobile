# Phase 6 Student Profile & Verification Foundation

## الهدف

تنفيذ أساس ملف الطالب الأكاديمي والتوثيق بعد المصادقة، مع تفعيل gate يمنع دخول الطالب إلى التطبيق قبل اكتمال الملف الأكاديمي وقبول التوثيق.

## ما تم تنفيذه

- إضافة `expo-image-picker` عبر `npx expo install expo-image-picker`.
- إضافة config plugin الخاص بـ `expo-image-picker` في `app.config.ts` مع صلاحية مكتبة الصور فقط.
- بناء `src/features/student-profile/`:
  - types للملف الأكاديمي والخيارات والرقم الجامعي.
  - service يستخدم API client وacademic services الحالية.
  - Zustand store غير persistent يعتمد على `accessToken` من auth store.
  - مكونات اختيار أكاديمي وstepper ومعاينة الرقم الجامعي.
  - شاشة `AcademicProfileSetupScreen` فعلية.
- بناء `src/features/verification/`:
  - types لحالة التوثيق وصورة البطاقة.
  - service يبني FormData بدون تعيين multipart `Content-Type` يدويا.
  - Zustand store غير persistent.
  - image picker من المعرض فقط.
  - شاشة إرسال التوثيق وشاشة الحالة وإعادة الإرسال.
- تفعيل `useStudentAccessGate` داخل `RootNavigator`.

## Endpoints المستخدمة

- `GET /api/v1/universities/`
- `GET /api/v1/universities/{university_id}/faculties/`
- `GET /api/v1/faculties/{faculty_id}/majors/`
- `GET /api/v1/academic-years/`
- `GET /api/v1/semesters/`
- `GET /api/v1/majors/{major_id}/subjects/`
- `GET /api/v1/students/me/profile/`
- `PATCH /api/v1/students/me/profile/`
- `GET /api/v1/students/student-number/parse/?student_number=...`
- `POST /api/v1/verification/submit/`
- `GET /api/v1/verification/me/`
- `POST /api/v1/verification/resubmit/`

## Navigation Gate

Root flow أصبح كالتالي:

1. `idle` أو `bootstrapping`: شاشة `AuthBootstrapScreen`.
2. `unauthenticated`: `PublicNavigator`.
3. authenticated + role غير `student`: `AppTabs` مؤقتا.
4. authenticated student + ملف أو توثيق غير مكتمل: `StudentSetupNavigator`.
5. authenticated student + ملف مكتمل + verification `approved`: `AppTabs`.

في حال فشل تحميل profile أو verification، يبقى المستخدم في StudentSetup مع رسالة وخيار retry.

## الخصوصية والأمان

- لا يتم حفظ صورة بطاقة الطالب خارج الذاكرة.
- لا يتم تسجيل URI الصورة أو FormData في logs.
- لا يتم نقل student profile data إلى auth store.
- auth store يبقى مسؤولا فقط عن session وtokens.
- `FormData` يمر إلى API client كما هو حتى يضبط runtime حدود multipart تلقائيا.

## ما لم يتم تنفيذه عمدا

- Home/Subjects/Groups/Chat/Files/PDF/Printing/Notifications/Support real data.
- التسجيل الكامل وOTP وpassword reset.
- TanStack Query.
- Camera capture.
- أي تعديل داخل `android/` أو `ios/`.
- تشغيل Expo dev server أو emulator أو EAS build.

## التحقق

نتائج التحقق بعد التنفيذ:

- `npm run typecheck`: نجح.
- `npm run lint`: نجح.
- `npm run format:check`: نجح بعد تشغيل `npm run format`.
- `npm run expo:config`: نجح ويعرض SDK `56.0.0` وplugin `expo-image-picker`.
- `npm run validate`: نجح.
- `npm audit`: نجح، `0 vulnerabilities`.
- `npm audit --omit=dev`: نجح، `0 vulnerabilities`.
- `npx expo config --type public`: نجح.
- `npm ls expo expo-image-picker expo-secure-store expo-status-bar react react-native`: نجح، ويؤكد `expo-image-picker@56.0.15` مع `expo@56.0.8`.

الأوامر التالية فشلت بسبب قيود البيئة لا بسبب خطأ في الكود:

- `npx expo-doctor`: داخل sandbox فشل بسبب `ENOTCACHED` واحتياج npm registry/cache. طلب التشغيل خارج sandbox رُفض تلقائيا بسبب حد الاستخدام في البيئة.
- `npx expo install --check`: داخل sandbox فشل بسبب `ECONNREFUSED 127.0.0.1:9`. طلب التشغيل خارج sandbox رُفض تلقائيا بسبب حد الاستخدام في البيئة.

لم يتم تشغيل Expo dev server أو emulator أو EAS build.
