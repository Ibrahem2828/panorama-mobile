# navigation

معمارية التنقل لتطبيق Panorama Mobile باستخدام React Navigation.

## الملفات

- `RootNavigator.tsx`: يقرأ auth state، يشغل bootstrap مرة واحدة، ويختار Public أو App flow.
- `PublicNavigator.tsx`: Splash وOnboarding وشاشات auth العامة.
- `StudentSetupNavigator.tsx`: إعداد الملف الأكاديمي والتوثيق، محفوظ للمراحل القادمة.
- `AppTabsNavigator.tsx`: تبويبات التطبيق الرئيسية للمستخدم المصادق حاليا.
- `stacks/`: nested stacks للتبويبات.
- `config/navigationTheme.ts`: theme متوافق مع design tokens.
- `config/screenOptions.ts`: خيارات stack مشتركة.
- `config/tabOptions.ts`: labels عربية وخيارات bottom tabs.
- `config/initialFlow.ts`: mapping من auth status إلى root flow.
- `guards/navigationGuards.ts`: guards أولية؛ StudentSetup guard غير مفعل بعد.
- `routes.ts`: route constants.
- `types.ts`: typed param lists.

## سلوك Phase 5

- أثناء bootstrap تظهر `AuthBootstrapScreen`.
- unauthenticated user يرى Public flow.
- authenticated user يرى AppTabs.
- StudentSetup flow يبقى موجودا لكنه غير نشط حتى Phase 6.

## القواعد

- لا تستخدم route strings عشوائية في الشاشات.
- لا تستدعي API من navigators.
- لا تخزن tokens داخل navigation.
- لا تفعل verification guards قبل تنفيذ Student Profile & Verification.
