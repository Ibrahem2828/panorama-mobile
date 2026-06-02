# navigation

يحتوي هذا المجلد معمارية التنقل لتطبيق Panorama Mobile باستخدام React Navigation.

## الملفات

- `RootNavigator.tsx`: يربط `NavigationContainer` ويختار التدفق الأولي.
- `PublicNavigator.tsx`: Splash وOnboarding وشاشات auth المؤقتة.
- `StudentSetupNavigator.tsx`: إعداد الملف الأكاديمي والتوثيق.
- `AppTabsNavigator.tsx`: تبويبات التطبيق الرئيسية.
- `stacks/`: nested stacks للتبويبات.
- `config/navigationTheme.ts`: theme متوافق مع tokens.
- `config/screenOptions.ts`: خيارات stack مشتركة.
- `config/tabOptions.ts`: labels عربية وخيارات bottom tabs.
- `config/initialFlow.ts`: اختيار تدفق تطويري مؤقت.
- `guards/navigationGuards.ts`: placeholders فقط للحراس المستقبلية.
- `routes.ts`: route constants.
- `types.ts`: typed param lists.

## القواعد

- لا تستخدم route strings عشوائية في الشاشات.
- لا تضف auth logic أو storage داخل navigation في Phase 3.
- لا تستدعي API من navigators.
- headers الافتراضية مخفية حاليا، والشاشات تستخدم `AppHeader` من Design System.
- لتغيير التدفق المعروض مؤقتا عدل `INITIAL_ROOT_FLOW` إلى `public` أو `studentSetup` أو `app`.
