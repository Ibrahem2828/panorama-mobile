# Phase 2 Design System Foundation

## الهدف

تأسيس طبقة تصميم قابلة لإعادة الاستخدام لتطبيق Panorama Mobile، مع الالتزام بكون التجربة Arabic-first وRTL-first، وبدون تنفيذ ميزات المنتج أو navigation أو auth أو API.

## ما تم تنفيذه

- توسيع `src/theme/` ليشمل ألوانا منظمة، spacing، radius، typography variants، shadows، layout، opacity، وzIndex.
- إنشاء مكونات `common` للنصوص، الأزرار، أزرار الأيقونات، الشارات، الصور الرمزية، والفواصل.
- إنشاء مكونات `layout` للشاشة، البطاقة، الهيدر، عنوان القسم، وStack.
- إنشاء مكونات `feedback` لحالات loading وempty وerror وsuccess.
- إنشاء مكونات `forms` لحقل النص وFormField بدون مكتبات forms خارجية.
- تحديث `App.tsx` إلى showcase بسيط يعرض foundation فقط.
- تحديث utilities للـ RTL والـ logger والـ strings.
- إضافة barrel exports لاستخدام المكونات من `src/components`.

## Theme Tokens

- `colors`: brand، background، text، border، semantic، status، gray، مع aliases قديمة مثل `colors.primary` و`colors.surface`.
- `spacing`: scale رقمية ومفاتيح named، مع screen/card/section spacing.
- `radius`: مفاتيح عامة ومفاتيح component-level مثل `card` و`button` و`input`.
- `typography`: variants جاهزة مثل `display` و`h1` و`body` و`button` و`input` و`label`.
- `shadows`: مستويات خفيفة متوافقة مع iOS وAndroid elevation.
- `layout`: قياسات شاشة، header، touch target، input، avatar، وicon button.
- `opacity`: disabled وpressed وoverlay/backdrop.
- `zIndex`: base/dropdown/sticky/modal/toast/overlay.

## المكونات

### Common

- `AppText`: Text موحد مع variants وألوان وRTL writing direction.
- `AppButton`: Pressable button بخمسة variants وثلاثة أحجام وحالات disabled/loading.
- `AppIconButton`: زر مربع أو دائري مع accessibility label إلزامي.
- `AppBadge`: شارات neutral/success/warning/error/info/brand.
- `AppAvatar`: initials عربية/إنجليزية أو image uri اختياري.
- `Divider`: فاصل أفقي مع spacing اختياري.

### Layout

- `AppScreen`: حاوية شاشة مع safe area وscroll واستخدام padding موحد.
- `AppCard`: بطاقة default/elevated/outlined/muted.
- `AppHeader`: هيدر بسيط بدون navigation logic.
- `SectionHeader`: عنوان قسم مع action اختياري.
- `Stack`: ترتيب vertical/horizontal مع gap وwrap.

### Feedback

- `LoadingState`
- `EmptyState`
- `ErrorState`
- `SuccessState`

### Forms

- `FormField`
- `AppTextInput`

## RTL وAccessibility

- `configureRtl` يضبط دعم RTL بدون تشغيل reload من داخل التطبيق.
- `getRTLTextAlign` و`getFlexDirection` و`getStartEndSpacing` تساعد على كتابة styles متوافقة مع RTL.
- touch target الافتراضي للأزرار 48px.
- الأزرار تستخدم `accessibilityRole` و`accessibilityState`.
- `AppIconButton` يتطلب `accessibilityLabel`.

## ما لم يتم تنفيذه عمدا

- لا توجد شاشات Login أو Register أو Home.
- لا توجد Navigation architecture.
- لا يوجد API client أو auth أو WebSocket.
- لا يوجد PDF viewer أو printing flow.
- لا توجد شاشات منتج حقيقية.
- لا توجد مكتبات UI خارجية أو form libraries.

## التحقق

آخر تشغيل محلي بعد تنفيذ Phase 2:

- `npm run typecheck`: نجح.
- `npm run lint`: نجح.
- `npm run format:check`: نجح بعد تشغيل `npm run format`.
- `npm run expo:config`: نجح.
- `npm run validate`: نجح، ويشمل typecheck وlint وformat:check وexpo:config.

## الاستخدام المستقبلي

عند بدء Phase 3 وما بعدها، يجب بناء الشاشات فوق `AppScreen` و`AppText` و`AppButton` و`AppCard` ومكونات `feedback/forms` بدلا من تكرار styles محلية. أي لون أو حجم أو radius جديد يجب أن يمر عبر `src/theme/` قبل استخدامه في شاشة.

## ملاحظات متبقية

- الخطوط المعرفة في tokens لم يتم تحميلها بعد عبر `expo-font`.
- الأيقونات لم يتم ربطها بمكتبة icons بعد.
- الاختبارات الآلية للمكونات لم تبدأ بعد لأن Phase 2 مخصصة للتأسيس فقط.
