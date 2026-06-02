# theme

يحتوي هذا المجلد theme tokens الرسمية لتطبيق Panorama Mobile.

## الملفات

- `colors.ts`: ألوان brand وbackground وtext وborder وsemantic.
- `spacing.ts`: scale موحدة للمسافات.
- `radius.ts`: حواف عامة وحواف مرتبطة بالمكونات.
- `typography.ts`: أحجام وأوزان وvariants للنصوص.
- `shadows.ts`: ظلال خفيفة متوافقة مع React Native.
- `layout.ts`: قياسات الشاشة، touch targets، header، input، avatar.
- `opacity.ts`: قيم pressed/disabled/overlay.
- `zIndex.ts`: طبقات overlay/modal/toast.
- `index.ts`: barrel exports.

## القاعدة

لا تستخدم ألوانا أو spacing أو radius عشوائية داخل الشاشات. إذا احتجت قيمة جديدة، أضفها هنا أولا ثم استخدمها عبر import من `src/theme`.
