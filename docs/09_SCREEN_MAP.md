# خريطة شاشات MVP

## التنظيم العام

```txt
Public
├── Splash
├── Onboarding
├── Login
├── RegisterStudent
├── OtpVerification
├── ForgotPassword
└── ResetPassword

Student Setup
├── AcademicProfileSetup
├── SubmitVerification
└── VerificationStatus

Main Tabs
├── Home
├── Subjects
│   ├── SubjectsList
│   └── SubjectDetails
├── Groups
│   ├── AvailableGroups
│   ├── MyGroups
│   ├── GroupDetails
│   └── ChatRoom
├── Printing
│   ├── PrintHome
│   ├── CreatePrintOrder
│   ├── PrintPriceSummary
│   ├── MyPrintOrders
│   └── PrintOrderDetails
└── Profile
    ├── ProfileHome
    ├── Settings
    ├── Notifications
    ├── SupportTickets
    ├── CreateSupportTicket
    └── TicketDetails

Shared
├── FilesList
├── FileDetails
├── PdfViewer
├── Search
├── PrivacyPolicy
├── Terms
└── About
```

## وصف الشاشات

| الشاشة               | الهدف                              | أهم المكونات                    | API المتوقع                 | الصلاحيات                  |
| -------------------- | ---------------------------------- | ------------------------------- | --------------------------- | -------------------------- |
| Splash               | تهيئة التطبيق وتحديد وجهة البداية. | شعار، حالة تحميل.               | session/profile عند الحاجة. | عامة.                      |
| Onboarding           | تقديم قيمة التطبيق بسرعة.          | شرائح قصيرة، زر بدء.            | لا يوجد غالبا.              | عامة.                      |
| Login                | دخول المستخدم.                     | حقول، زر دخول، روابط مساعدة.    | auth login.                 | عامة.                      |
| RegisterStudent      | إنشاء حساب طالب.                   | نموذج تسجيل.                    | auth register.              | عامة.                      |
| OtpVerification      | تأكيد الحساب.                      | إدخال OTP، إعادة إرسال.         | verify otp، resend.         | عامة.                      |
| ForgotPassword       | بدء استعادة كلمة المرور.           | حقل هاتف أو بريد.               | forgot password.            | عامة.                      |
| ResetPassword        | تعيين كلمة مرور جديدة.             | OTP أو token، كلمة جديدة.       | reset password.             | عامة.                      |
| AcademicProfileSetup | إكمال بيانات الطالب.               | حقول جامعة وكلية وسنة.          | academic profile.           | مستخدم مسجل.               |
| SubmitVerification   | إرسال طلب توثيق.                   | رفع مستند، ملاحظات.             | verification submit.        | مستخدم مسجل.               |
| VerificationStatus   | متابعة حالة التوثيق.               | حالة، سبب رفض، إعادة إرسال.     | verification status.        | مستخدم مسجل.               |
| Home                 | مدخل الطالب اليومي.                | بطاقات مواد، غروبات، إشعارات.   | home summary.               | حسب حالة التوثيق.          |
| SubjectsList         | عرض المواد.                        | قائمة، فلترة بسيطة.             | subjects list.              | طالب موثق غالبا.           |
| SubjectDetails       | تفاصيل مادة.                       | وصف، ملفات، غروبات.             | subject detail.             | حسب صلاحية المادة.         |
| AvailableGroups      | غروبات متاحة.                      | قائمة، حالة انضمام.             | groups available.           | طالب موثق.                 |
| MyGroups             | غروبات الطالب.                     | قائمة الغروبات المنضم لها.      | groups mine.                | طالب موثق.                 |
| GroupDetails         | تفاصيل غروب.                       | وصف، رابط واتساب، زر محادثة.    | group detail.               | عضو أو مؤهل.               |
| ChatRoom             | محادثة الغروب.                     | رسائل، حقل إرسال، حالة اتصال.   | chat messages، WebSocket.   | عضو مصرح.                  |
| PrintHome            | مدخل الطباعة.                      | خدمات، طلب جديد، طلباتي.        | print services.             | حسب التوثيق.               |
| CreatePrintOrder     | بناء طلب طباعة.                    | خيارات ديناميكية، ملفات، كميات. | print options.              | طالب موثق.                 |
| PrintPriceSummary    | مراجعة السعر.                      | ملخص، إجمالي، تأكيد.            | calculate/submit order.     | طالب موثق.                 |
| MyPrintOrders        | طلبات الطباعة.                     | قائمة حالات.                    | print orders.               | الطالب يرى طلباته.         |
| PrintOrderDetails    | تفاصيل طلب طباعة.                  | الحالة، السعر، الاستلام.        | print order detail.         | صاحب الطلب.                |
| ProfileHome          | حساب المستخدم.                     | بيانات، حالة توثيق، روابط.      | me/profile.                 | مستخدم مسجل.               |
| Settings             | إعدادات عامة.                      | تسجيل خروج، سياسة، حول.         | logout عند الحاجة.          | مستخدم مسجل.               |
| Notifications        | الإشعارات.                         | قائمة، تعليم كمقروء.            | notifications.              | المستخدم يرى إشعاراته.     |
| SupportTickets       | تذاكر الدعم.                       | قائمة، حالة، إنشاء.             | support tickets.            | مستخدم مسجل.               |
| CreateSupportTicket  | إنشاء تذكرة.                       | تصنيف، وصف، مرفق اختياري.       | support create.             | مستخدم مسجل.               |
| TicketDetails        | متابعة تذكرة.                      | محادثة دعم، حالة.               | ticket detail/replies.      | صاحب التذكرة.              |
| FilesList            | عرض ملفات سياقية.                  | قائمة ملفات.                    | files list.                 | حسب المادة أو الغروب.      |
| FileDetails          | تفاصيل ملف.                        | معلومات، فتح، طباعة.            | file detail.                | حسب الصلاحية.              |
| PdfViewer            | فتح ملف داخل التطبيق.              | عارض PDF، retry.                | file stream/url.            | Authorization مطلوب غالبا. |
| Search               | بحث بسيط.                          | حقل، نتائج.                     | search.                     | حسب الصلاحيات.             |
| PrivacyPolicy        | سياسة الخصوصية.                    | نص منسق.                        | static/page.                | عامة.                      |
| Terms                | الشروط.                            | نص منسق.                        | static/page.                | عامة.                      |
| About                | معلومات التطبيق.                   | الإصدار، وصف مختصر.             | app config.                 | عامة.                      |
