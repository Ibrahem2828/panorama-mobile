# verification

Feature خاص بإرسال بطاقة الطالب ومتابعة حالة التوثيق.

## ما يغطيه

- قراءة حالة التوثيق من `/api/v1/verification/me/`.
- إرسال طلب جديد إلى `/api/v1/verification/submit/`.
- إعادة الإرسال إلى `/api/v1/verification/resubmit/` للحالات `rejected` و`needs_update`.
- اختيار صورة بطاقة الطالب من المعرض عبر `expo-image-picker`.
- بناء `FormData` بدون تعيين multipart `Content-Type` يدويا.
- Zustand store غير persistent يعتمد على `accessToken` من auth store فقط.

## حدود الخصوصية

- لا يتم تسجيل URI الصورة أو محتوى FormData.
- لا يتم حفظ صورة البطاقة في store دائم أو SecureStore.
- يتم الاحتفاظ بالصورة المختارة داخل الذاكرة فقط حتى الإرسال أو الإزالة.
