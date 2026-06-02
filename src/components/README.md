# components

مجلد المكونات المشتركة غير المرتبطة بميزة محددة. مكونات Phase 2 هي foundation فقط ولا تحتوي business logic أو navigation أو API calls.

## الأقسام

- `common`: نصوص، أزرار، شارات، avatar، وفواصل.
- `layout`: AppScreen، AppCard، AppHeader، PlaceholderScreen، SectionHeader، Stack.
- `feedback`: loading، empty، error، success.
- `forms`: FormField وAppTextInput.

## الاستخدام

استورد المكونات من barrel العام:

```ts
import { AppButton, AppCard, AppText } from './src/components';
```

أي شاشة جديدة يجب أن تبدأ من primitives الموجودة هنا قبل إضافة styles محلية.
