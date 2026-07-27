# API Services — Panorama Mobile v2

هذه الطبقة هي العقد الوحيد بين الواجهات وBackend v2. لا تستدعي الشاشات `fetch` مباشرة.

الخدمات الحالية:

- `auth.service.ts`: التسجيل، OTP، الدخول، refresh rotation، logout والحساب.
- `academic.service.ts`: الجامعات والكليات والاختصاصات والسنوات والفصول والمواد مع pagination/search.
- `verification.service.ts`: إرسال وإعادة إرسال ومتابعة التوثيق.
- `groups.service.ts`: الغروبات، العضوية، الرسائل، وتذكرة واتساب المؤقتة.
- `files.service.ts`: الملفات وتذاكر العرض المحمية؛ لا توجد روابط تخزين خام.
- `printing.service.ts`: quote، الطلبات، الإلغاء، نقاط الاستلام، وتذاكر عناصر الطباعة.
- `notifications.service.ts`: القائمة، غير المقروء، القراءة، Device Tokens.
- `support.service.ts`: التذاكر والرسائل وتذاكر المرفقات.
- Feedback يستخدم عميل API نفسه داخل feature service.

قواعد إلزامية:

1. Backend هو مصدر الحقيقة للصلاحيات والحالات والأسعار.
2. لا يضاف endpoint جديد قبل وجوده في OpenAPI.
3. لا يعاد raw backend error إلى المستخدم.
4. لا تحفظ الروابط الحساسة أو التوكنات في logs.
