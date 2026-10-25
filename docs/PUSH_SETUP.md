# تفعيل الإشعارات الفورية (والتطبيق مغلق)

الإشعار الذي يصل والتطبيق مغلق يمرّ عبر خدمة Firebase Cloud Messaging (FCM) من Google. التطبيق جاهز لها، لكنها تحتاج حسابك على Firebase لأن Google لا تسمح بالإرسال بلا مشروع باسمك. الخطوات مرة واحدة فقط:

## 1) إنشاء مشروع Firebase (مجاني)
1. افتح https://console.firebase.google.com وأنشئ مشروعًا باسم «Panorama».
2. أضف تطبيق **Android** باسم الحزمة `com.panorama.student`.
3. نزّل الملف **google-services.json** وضعه في جذر مشروع الجوال (بجانب `app.config.ts`) أو أعطني مساره. الملف في `.gitignore` ولا يُرفع إلى GitHub.

## 2) ربط FCM بخدمة Expo (التي يستعملها الخادم للإرسال)
1. في Firebase: إعدادات المشروع ← Service accounts ← **Generate new private key** (ملف JSON). لا تشاركه علنًا.
2. في https://expo.dev ← مشروع Panorama ← Credentials ← Android ← `com.panorama.student` ← **FCM V1 service account key** ← ارفع الملف.

## 3) على الخادم
- في `.env` للخادم: `PUSH_NOTIFICATIONS_ENABLED=true` (اختياريًا `EXPO_ACCESS_TOKEN` من حسابك لرفع حدود الإرسال).
- شغّل خدمة `beat` (موجودة) لأنها تتابع وصول الإشعارات وتزيل الأجهزة الميتة.

## 4) بناء التطبيق
بعد وضع `google-services.json` ابنِ التطبيق كالمعتاد: يلتقطه `app.config.ts` تلقائيًا ويُسجّل الجهاز عند فتح التطبيق بعد السماح بالإشعارات.

## صوت الإشعار
ملف الصوت المميّز `src/assets/sounds/panorama.wav` (نغمة صاعدة هادئة من ثلاث نغمات). يُضمَّن في التطبيق عبر إضافة expo-notifications، وتستعمله قنوات أندرويد (`general` و`chat` و`groups` و`printing` و`verification` و`support`). لإعادة توليده أو تعديله: `python scripts/make-notification-sound.py`.
ملاحظة: قنوات أندرويد لا يمكن تغيير صوتها بعد إنشائها، لذلك استُعملت معرّفات جديدة (`general` بدل `default`)، وسيسمع المستخدم الصوت الجديد بعد تحديث التطبيق.

## التحقق
1. افتح التطبيق على هاتف حقيقي وسجّل الدخول وسمح بالإشعارات.
2. أغلق التطبيق تمامًا (من قائمة التطبيقات الأخيرة).
3. أرسل رسالة في مجموعة من حساب آخر: يجب أن يصل الإشعار خلال ثوانٍ بالصوت المميز.
