# auth

نطاق المصادقة في Panorama Mobile.

## ما تم تنفيذه في Phase 5

- شاشة Login فعلية باللغة العربية.
- Auth store عبر Zustand.
- تخزين access token وrefresh token عبر Expo SecureStore.
- Bootstrap للجلسة عند تشغيل التطبيق.
- Login orchestration عبر API service وsession service.
- تحميل المستخدم الحالي من `/api/v1/auth/me/`.
- Refresh access token عند انتهاء الجلسة أثناء bootstrap.
- Logout يمسح التوكنات المحلية دائما.
- AuthBootstrapScreen أثناء التحقق من الجلسة.

## الملفات

- `types.ts`: أنواع المستخدم والتوكنات وحالة المصادقة.
- `components/AuthFormCard.tsx`: حاوية نموذج تسجيل الدخول.
- `components/PasswordInput.tsx`: حقل كلمة مرور مع إظهار/إخفاء.
- `services/authTokenStorage.ts`: تخزين آمن للتوكنات عبر SecureStore.
- `services/authSessionService.ts`: تنسيق login/bootstrap/refresh/logout.
- `store/authStore.ts`: Zustand store لحالة المصادقة.
- `screens/LoginScreen.tsx`: شاشة تسجيل الدخول المربوطة بالـ store.

## ما لم يتم تنفيذه بعد

- Register Student الكامل.
- OTP الكامل.
- Forgot/Reset Password الكامل.
- Student Profile setup.
- Student Verification.
- Role-based dashboard.

الشاشات غير المكتملة تبقى placeholders عربية ولا تستدعي API.

## قواعد مهمة

- لا تستخدم AsyncStorage للتوكنات.
- لا تسجل tokens أو passwords.
- لا تكتب direct fetch داخل الشاشات.
- لا تضف API calls خارج auth في هذه المرحلة.
- API service لا يحتوي على SecureStore أو Zustand.
