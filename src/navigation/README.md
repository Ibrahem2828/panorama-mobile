# navigation

معمارية التنقل لتطبيق Panorama Mobile باستخدام React Navigation.

## الملفات

- `RootNavigator.tsx`: يشغل auth bootstrap ثم يختار `Public` أو `StudentSetup` أو `AppTabs`.
- `PublicNavigator.tsx`: Splash وOnboarding وشاشات auth العامة.
- `StudentSetupNavigator.tsx`: إكمال الملف الأكاديمي، إرسال بطاقة الطالب، وحالة التوثيق.
- `AppTabsNavigator.tsx`: تبويبات التطبيق الرئيسية للمستخدم المسموح له بالدخول.
- `guards/useStudentAccessGate.ts`: gate الفعلي للطالب بعد المصادقة.
- `guards/navigationGuards.ts`: دوال guard نقية قابلة للاختبار.
- `routes.ts`: route constants.
- `types.ts`: typed param lists.

## سلوك Phase 6

- أثناء auth bootstrap تظهر `AuthBootstrapScreen`.
- المستخدم غير المصادق يرى `Public`.
- المستخدم المصادق بدور غير `student` يدخل `AppTabs` مؤقتا حتى تتضح قواعد هذه الأدوار.
- الطالب المصادق لا يدخل `AppTabs` إلا بعد اكتمال الملف الأكاديمي وحالة توثيق `approved`.
- الطالب غير المكتمل أو غير الموثق يدخل `StudentSetup`.
- عند فشل تحميل الملف أو التوثيق بسبب الشبكة يبقى الطالب داخل `StudentSetup` مع retry من الشاشات، ولا يحدث crash.

## القواعد

- لا تستخدم route strings عشوائية داخل الشاشات.
- لا تخزن tokens داخل navigation.
- لا تضع student profile data داخل auth store.
- لا تشغل dev server من طبقة navigation أو أثناء validation.
