# أمن Panorama Mobile v2

## الضوابط المنفذة

- SecureStore للرموز بدل AsyncStorage.
- لا تسجيل للتوكنات أو OTP أو كلمات المرور.
- HTTPS/WSS إجباريان خارج development.
- cleartext مسموح فقط بتفعيل صريح في development.
- Protected file tickets مع تقييد origin/path داخل WebView.
- منع لقطات الشاشة أثناء عرض الملفات قدر الإمكان.
- رابط واتساب لا يصل كتفصيل خام؛ يُفتح عبر redirect ticket موثوق.
- السعر النهائي للطباعة من Backend فقط.
- رسائل أخطاء آمنة لا تعرض JSON أو Stack Trace.
- واجهة الصلاحيات لا تعتبر بديلًا عن تحقق Backend.

## متطلبات ما قبل الإنتاج

- تفعيل certificate pinning فقط بعد وضع خطة rotation وعدم كسر العملاء.
- ربط Sentry مع redaction كامل للبيانات الحساسة.
- فحص Root/Jailbreak كإشارة مخاطر لا كمنع وحيد.
- اختبار IDOR والروابط المؤقتة وWebSocket وOTP.
- مراجعة سياسة الاحتفاظ ببطاقة الطالب والملفات.
- إعداد Privacy Manifest وGoogle Play Data Safety وApp Store privacy labels.
