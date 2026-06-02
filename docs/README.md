# فهرس وثائق Panorama

هذا المجلد يحتوي وثائق مشروع Panorama Mobile من Phase 0 حتى Phase 5.5.

| الملف                                        | الوصف                                                                      |
| -------------------------------------------- | -------------------------------------------------------------------------- |
| `00_PROJECT_OVERVIEW.md`                     | وصف المشروع والمشكلة والفئة المستهدفة وحدود التطبيق.                       |
| `01_PRODUCT_DECISIONS.md`                    | قرارات المنتج الأساسية مثل Arabic-first وRTL-first والباك إند كمصدر حقيقة. |
| `02_MVP_SCOPE.md`                            | نطاق MVP والميزات المؤجلة.                                                 |
| `03_USER_ROLES.md`                           | أدوار المستخدمين وصلاحياتهم وقيودهم.                                       |
| `04_USER_JOURNEYS.md`                        | رحلات المستخدم الأساسية.                                                   |
| `05_FUNCTIONAL_REQUIREMENTS.md`              | المتطلبات الوظيفية حسب modules.                                            |
| `06_NON_FUNCTIONAL_REQUIREMENTS.md`          | متطلبات الأداء والأمان والخصوصية وRTL والصيانة.                            |
| `07_MOBILE_ARCHITECTURE_DECISIONS.md`        | قرارات معمارية تطبيق الموبايل.                                             |
| `08_VISUAL_IDENTITY.md`                      | الهوية البصرية والتوكنز.                                                   |
| `09_SCREEN_MAP.md`                           | خريطة شاشات MVP.                                                           |
| `10_API_INTEGRATION_ASSUMPTIONS.md`          | افتراضات API وWebSocket والردود.                                           |
| `11_RELEASE_AND_ENVIRONMENT_STRATEGY.md`     | استراتيجية البيئات والإصدارات.                                             |
| `12_CODEX_PROMPTING_RULES.md`                | قواعد تنفيذ المراحل مع Codex.                                              |
| `13_PHASE_1_PROJECT_INITIALIZATION.md`       | توثيق إنشاء المشروع.                                                       |
| `14_PHASE_1_5_PROJECT_VALIDATION.md`         | توثيق مشاكل التحقق قبل Phase 1.6.                                          |
| `15_PHASE_1_6_PRODUCTION_TOOLING_FIX.md`     | إصلاح tooling والتحقق.                                                     |
| `16_PHASE_2_DESIGN_SYSTEM_FOUNDATION.md`     | تأسيس نظام التصميم.                                                        |
| `17_PHASE_3_NAVIGATION_ARCHITECTURE.md`      | تأسيس navigation architecture.                                             |
| `18_PHASE_4_API_CLIENT_FOUNDATION.md`        | تأسيس API client والخدمات.                                                 |
| `19_PHASE_5_AUTHENTICATION_FOUNDATION.md`    | تأسيس المصادقة والجلسة والتخزين الآمن.                                     |
| `20_PHASE_5_5_EXPO_SDK_AUDIT_AND_UPGRADE.md` | تدقيق Expo SDK وترقية المشروع إلى SDK 56.                                  |

## الحالة الحالية

تم تنفيذ Phase 5.5 Expo SDK Audit & Safe Upgrade Decision. نتائج التحقق النهائية موثقة داخل `20_PHASE_5_5_EXPO_SDK_AUDIT_AND_UPGRADE.md`.

## طريقة القراءة المقترحة

1. ابدأ بوثائق Phase 0 لفهم المنتج والقيود.
2. راجع Phase 2 قبل إضافة أي UI جديد.
3. راجع Phase 3 قبل إضافة أو تعديل routes.
4. راجع Phase 4 قبل إضافة أي API integration.
5. راجع Phase 5 قبل أي عمل على الجلسة أو التوكنات أو guards.
6. راجع Phase 5.5 قبل أي تعديل على Expo SDK أو الحزم المدارة أو EAS config.
