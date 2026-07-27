# معمارية Panorama Mobile v2

## الطبقات

- `src/api`: عميل HTTP موحد، عقود Types، Endpoints، pagination، refresh retry.
- `src/features`: كل مجال مستقل: auth, verification, groups, files, printing, feedback…
- `src/navigation`: تدفقات Public / StudentSetup / AppTabs ومسارات Typed.
- `src/components`: Design System قابل لإعادة الاستخدام.
- `src/providers`: الاتصال، التقييم، Push Notifications.
- `src/config`: بيئة التشغيل وفرض HTTPS/WSS.
- `src/utils`: logging آمن، RTL، motion، trusted URL validation.

## تدفق الجلسة

1. قراءة الرموز من SecureStore.
2. تحميل المستخدم الحالي من Backend.
3. عند 401 يتم refresh مرة واحدة عبر قفل مشترك.
4. إذا نجح rotation تُحفظ الرموز الجديدة.
5. إذا فشل refresh تُمسح الجلسة وينتقل المستخدم إلى Public.

## فصل الأدوار

- `student`: ملف أكاديمي ثم توثيق ثم AppTabs الطلابية.
- `normal_user`: يدخل الخدمات العامة والطباعة والدعم دون APIs طلابية.
- الأدوار الإدارية لا تستخدم تطبيق الطالب وتُوجّه للداشبورد.

## مبادئ التكامل

- Backend هو مصدر الحقيقة للصلاحيات والأسعار والحالات.
- التطبيق لا يخزن أو يحسب سعرًا نهائيًا.
- التطبيق لا يستهلك Storage URL خامًا.
- كل مورد حساس يفتح بتذكرة قصيرة العمر.
- أي ميزة غير موجودة في OpenAPI لا تُخترع داخل الموبايل.
