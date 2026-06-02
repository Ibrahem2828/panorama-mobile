# افتراضات الربط مع الباك إند

هذه الوثيقة لا تنفذ أي كود. هدفها تحديد توقعات الربط للمرحلة القادمة.

## إعدادات عامة

- `API_BASE_URL` يأتي من env.
- `WS_BASE_URL` يأتي من env.
- API prefix المتوقع: `/api/v1/`.
- المصادقة عبر Bearer Token.
- يوجد access token وrefresh token.
- عند 401 يحاول التطبيق refresh مرة واحدة.
- عند فشل refresh يتم logout آمن.

## شكل الرد المتوقع

```json
{
  "success": true,
  "message": "تمت العملية بنجاح",
  "data": {},
  "errors": null
}
```

## Pagination

```json
{
  "count": 100,
  "next": "https://api.example.com/api/v1/items?page=2",
  "previous": null,
  "results": []
}
```

## Multipart

يستخدم Multipart عند رفع البطاقة الجامعية أو الملفات المطلوبة للتوثيق أو الدعم أو الطباعة عند الحاجة.

## WebSocket للمحادثات

- يستخدم WebSocket للمحادثات داخل الغروبات.
- يمكن تمرير token في query string إذا اعتمد الباك إند ذلك.
- يجب دعم reconnect عند الانقطاع.
- يجب أن تكون الرسالة القادمة من الخادم قابلة للتمييز عبر type واضح.

## الملفات

- الملفات قد تكون محمية وتحتاج Authorization.
- التطبيق لا يعرض زر تنزيل مباشر للطالب في MVP.
- فتح الملف قد يكون عبر signed URL قصير الصلاحية أو endpoint محمي.

## الطباعة

- خدمات الطباعة والأسعار والخيارات وأماكن الاستلام يجب أن تأتي من API.
- إذا لم تكن endpoints جاهزة، يجب توثيق أي fallback مؤقت وإزالته لاحقا.

## Endpoints متوقعة

| المجال        | Endpoint متوقع                          | الغرض                                             |
| ------------- | --------------------------------------- | ------------------------------------------------- |
| Auth          | `POST /api/v1/auth/login/`              | تسجيل الدخول.                                     |
| Auth          | `POST /api/v1/auth/register/`           | إنشاء حساب.                                       |
| Auth          | `POST /api/v1/auth/otp/verify/`         | تأكيد OTP.                                        |
| Auth          | `POST /api/v1/auth/token/refresh/`      | تجديد access token.                               |
| Auth          | `POST /api/v1/auth/logout/`             | تسجيل الخروج.                                     |
| Profile       | `GET /api/v1/me/`                       | بيانات المستخدم الحالي.                           |
| Academic      | `GET/PUT /api/v1/student-profile/`      | قراءة وتحديث الملف الأكاديمي.                     |
| Verification  | `GET /api/v1/verification/status/`      | حالة التوثيق.                                     |
| Verification  | `POST /api/v1/verification/submit/`     | إرسال طلب توثيق.                                  |
| Home          | `GET /api/v1/home/`                     | ملخص الصفحة الرئيسية.                             |
| Subjects      | `GET /api/v1/subjects/`                 | قائمة المواد.                                     |
| Subjects      | `GET /api/v1/subjects/{id}/`            | تفاصيل مادة.                                      |
| Groups        | `GET /api/v1/groups/available/`         | الغروبات المتاحة.                                 |
| Groups        | `GET /api/v1/groups/my/`                | غروبات الطالب.                                    |
| Groups        | `GET /api/v1/groups/{id}/`              | تفاصيل غروب.                                      |
| Chat          | `GET /api/v1/groups/{id}/messages/`     | رسائل الغروب.                                     |
| Chat          | `POST /api/v1/groups/{id}/messages/`    | إرسال رسالة نصية إذا لم يستخدم WebSocket للإرسال. |
| Files         | `GET /api/v1/files/`                    | قائمة ملفات حسب سياق.                             |
| Files         | `GET /api/v1/files/{id}/`               | تفاصيل ملف.                                       |
| Files         | `GET /api/v1/files/{id}/view/`          | رابط أو stream للعرض داخل التطبيق.                |
| Printing      | `GET /api/v1/printing/services/`        | خدمات وخيارات الطباعة.                            |
| Printing      | `POST /api/v1/printing/price/`          | حساب السعر.                                       |
| Printing      | `POST /api/v1/printing/orders/`         | إنشاء طلب.                                        |
| Printing      | `GET /api/v1/printing/orders/`          | طلبات الطالب.                                     |
| Printing      | `GET /api/v1/printing/orders/{id}/`     | تفاصيل طلب.                                       |
| Notifications | `GET /api/v1/notifications/`            | قائمة الإشعارات.                                  |
| Notifications | `POST /api/v1/notifications/{id}/read/` | تعليم كمقروء.                                     |
| Support       | `GET /api/v1/support/tickets/`          | قائمة التذاكر.                                    |
| Support       | `POST /api/v1/support/tickets/`         | إنشاء تذكرة.                                      |
| Support       | `GET /api/v1/support/tickets/{id}/`     | تفاصيل تذكرة.                                     |
| Static        | `GET /api/v1/pages/privacy/`            | سياسة الخصوصية.                                   |
| Static        | `GET /api/v1/pages/terms/`              | الشروط.                                           |

## ملاحظات تكامل

- أسماء endpoints قابلة للتعديل عند استلام وثائق الباك إند الرسمية.
- المهم هو الحفاظ على API Client موحد وtypes واضحة.
- لا تفترض الواجهة أن المستخدم موثق إلا من بيانات الباك إند.
