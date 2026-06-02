# فهرس وثائق Panorama

هذا المجلد يحتوي وثائق مشروع Panorama Mobile من Phase 0 حتى Phase 4.

| الملف                                    | الوصف                                                                                      |
| ---------------------------------------- | ------------------------------------------------------------------------------------------ |
| `00_PROJECT_OVERVIEW.md`                 | وصف المشروع، المشكلة، الفئة المستهدفة، قيمة المنتج، وحدود التطبيق والباك إند ولوحة التحكم. |
| `01_PRODUCT_DECISIONS.md`                | قرارات المنتج الأساسية مثل Arabic-first وRTL-first والمحادثات الداخلية وعدم تنزيل الملفات. |
| `02_MVP_SCOPE.md`                        | نطاق MVP والميزات المؤجلة وملاحظات ضبط حجم النسخة الأولى.                                  |
| `03_USER_ROLES.md`                       | أدوار المستخدمين وصلاحياتهم وقيودهم وحالاتهم الخاصة.                                       |
| `04_USER_JOURNEYS.md`                    | رحلات المستخدم الأساسية من أول استخدام حتى تسجيل الخروج.                                   |
| `05_FUNCTIONAL_REQUIREMENTS.md`          | المتطلبات الوظيفية مقسمة حسب Modules.                                                      |
| `06_NON_FUNCTIONAL_REQUIREMENTS.md`      | متطلبات الأداء، الأمان، الخصوصية، RTL، الصيانة، الاختبار، وجاهزية الإنتاج.                 |
| `07_MOBILE_ARCHITECTURE_DECISIONS.md`    | المعمارية المقترحة لتطبيق React Native وهيكل المجلدات المتوقع.                             |
| `08_VISUAL_IDENTITY.md`                  | الهوية البصرية، الألوان، الخطوط، الأزرار، البطاقات، الحقول، والأيقونات.                    |
| `09_SCREEN_MAP.md`                       | خريطة شاشات MVP ووصف كل شاشة وارتباطها المتوقع بـ API والصلاحيات.                          |
| `10_API_INTEGRATION_ASSUMPTIONS.md`      | افتراضات الربط مع API وWebSocket وشكل الردود والـ endpoints المتوقعة.                      |
| `11_RELEASE_AND_ENVIRONMENT_STRATEGY.md` | استراتيجية البيئات والإصدارات ومتطلبات الإنتاج وEAS Build لاحقا.                           |
| `12_CODEX_PROMPTING_RULES.md`            | قواعد استخدام Codex في المراحل القادمة لتجنب تجاوز النطاق أو كسر القرارات.                 |
| `13_PHASE_1_PROJECT_INITIALIZATION.md`   | توثيق إنشاء مشروع Expo/TypeScript والبنية الأساسية والسكربتات.                             |
| `14_PHASE_1_5_PROJECT_VALIDATION.md`     | توثيق مشاكل Phase 1.5 التي بقيت قبل إصلاحها في Phase 1.6.                                  |
| `15_PHASE_1_6_PRODUCTION_TOOLING_FIX.md` | توثيق إصلاح tooling وExpo config وTypeScript وPrettier وaudit.                             |
| `16_PHASE_2_DESIGN_SYSTEM_FOUNDATION.md` | توثيق تأسيس Design System foundation والمكونات والتوكنز والتحقق.                           |
| `17_PHASE_3_NAVIGATION_ARCHITECTURE.md`  | توثيق React Navigation architecture والتدفقات والـ route types والشاشات المؤقتة.           |
| `18_PHASE_4_API_CLIENT_FOUNDATION.md`    | توثيق API Client foundation، endpoint map، error normalization، وservice foundations.      |

## طريقة القراءة المقترحة

1. ابدأ بنظرة المشروع العامة وقرارات المنتج.
2. راجع نطاق MVP والأدوار والرحلات.
3. اقرأ المتطلبات وخريطة الشاشات.
4. استخدم وثائق المعمارية والهوية وAPI assumptions قبل تنفيذ المراحل التالية.
5. راجع وثيقة Phase 4 قبل بدء Phase 5 للتأكد من عدم تكرار endpoint strings أو تجاوز API client.

## الحالة الحالية

تم تنفيذ Phase 4 API Client Foundation. نتائج التحقق النهائية موثقة داخل `18_PHASE_4_API_CLIENT_FOUNDATION.md`.
