# student-profile

Feature خاص بإكمال الملف الأكاديمي للطالب بعد تسجيل الدخول.

## ما يغطيه

- تحميل الجامعات والكليات والاختصاصات والسنوات الأكاديمية والفصول.
- تحميل مواد الاختصاص كأساس ربط أكاديمي لاحق بدون تنفيذ شاشة Subjects.
- قراءة وتحديث `/api/v1/students/me/profile/`.
- تحليل الرقم الجامعي عبر `/api/v1/students/student-number/parse/`.
- Zustand store غير persistent يعتمد على `accessToken` من auth store فقط.
- شاشة `AcademicProfileSetupScreen` بواجهة RTL عربية ومكونات اختيار داخلية بدون dependency إضافية.

## الحدود

- لا يخزن هذا feature توكنات أو صورا.
- لا يضع بيانات الملف الأكاديمي داخل auth store.
- لا ينفذ Home أو Subjects أو Groups أو Chat.
