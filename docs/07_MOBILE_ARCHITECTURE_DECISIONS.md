# قرارات معمارية تطبيق الموبايل

هذه الوثيقة تقترح معمارية مرحلة التنفيذ القادمة، دون إنشاء كود في Phase 0.

## القرارات الأساسية

- استخدام TypeScript لكل ملفات التطبيق.
- اعتماد Feature-based architecture لتقليل التشابك بين النطاقات.
- بناء Shared Design System للثيم، الألوان، المكونات المشتركة، وحالات الواجهة.
- استخدام API Layer موحد لكل طلبات HTTP.
- استخدام Auth Store لحالة الجلسة والمستخدم.
- إدارة Server State عبر TanStack Query.
- إدارة Local/Auth/UI State الخفيف عبر Zustand.
- تخزين tokens عبر SecureStore.
- تطبيق Navigation Guards حسب حالة الدخول والتوثيق.
- توحيد Error Handling ورسائل الخطأ.
- استخدام React Hook Form وZod للنماذج والتحقق.
- تجهيز WebSocket Service للمحادثات.
- عزل File Viewer Service عن تفاصيل الشاشات.
- بناء Printing Draft/Cart logic بشكل مستقل عن شاشة إنشاء الطلب.
- فصل Environment configs حسب development وpreview وproduction.

## هيكل المجلدات المقترح

```txt
src/
├── api/
├── assets/
├── components/
├── config/
├── constants/
├── features/
│   ├── auth/
│   ├── onboarding/
│   ├── student-profile/
│   ├── verification/
│   ├── home/
│   ├── subjects/
│   ├── groups/
│   ├── chat/
│   ├── files/
│   ├── printing/
│   ├── notifications/
│   ├── profile/
│   ├── settings/
│   └── support/
├── hooks/
├── i18n/
├── navigation/
├── providers/
├── services/
├── store/
├── theme/
├── types/
└── utils/
```

## دور كل مجلد

| المجلد        | الدور                                                                      |
| ------------- | -------------------------------------------------------------------------- |
| `api/`        | API Client، interceptors، endpoints، types المشتركة للردود.                |
| `assets/`     | الصور، الأيقونات، الخطوط لاحقا، وملفات العرض الثابتة.                      |
| `components/` | مكونات UI مشتركة لا تنتمي إلى Feature محددة.                               |
| `config/`     | إعدادات البيئة، القيم القادمة من env، إعدادات التطبيق العامة.              |
| `constants/`  | ثوابت آمنة غير تشغيلية مثل مفاتيح route أو أسماء حالات عامة.               |
| `features/`   | نطاقات المنتج المستقلة، وكل Feature تحتوي شاشاتها وhooks وservices الخاصة. |
| `hooks/`      | hooks عامة قابلة لإعادة الاستخدام خارج Feature محددة.                      |
| `i18n/`       | إعدادات النصوص واللغة إذا تقرر تجهيز تعدد لغات لاحقا، مع العربية كافتراض.  |
| `navigation/` | تعريف المسارات، guards، stacks، tabs.                                      |
| `providers/`  | QueryClientProvider، ThemeProvider، AuthProvider وأي providers عامة.       |
| `services/`   | خدمات مشتركة مثل WebSocket، file viewer، notifications abstraction.        |
| `store/`      | Zustand stores العامة مثل auth وui.                                        |
| `theme/`      | الألوان، typography، spacing، radius، shadows.                             |
| `types/`      | أنواع مشتركة بين أكثر من Feature.                                          |
| `utils/`      | دوال مساعدة صغيرة وخالية من منطق المنتج الثقيل.                            |

## قواعد معمارية

- لا تكتب API calls مباشرة داخل الشاشات؛ استخدم hooks أو services فوق API Client.
- لا تخلط منطق الطباعة أو المحادثة داخل مكونات UI.
- كل Feature مسؤولة عن تفاصيلها، لكن الصلاحيات والجلسة والثيم تبقى مشتركة.
- أي قيمة قابلة للتغيير من لوحة التحكم لا تثبت داخل التطبيق.
- كل شاشة يجب أن تتعامل مع Loading وError وEmpty وPermission states.
