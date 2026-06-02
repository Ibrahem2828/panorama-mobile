# Phase 3 Navigation Architecture Foundation

## الهدف

تأسيس معمارية تنقل typed وقابلة للتوسع لتطبيق Panorama Mobile، مع الحفاظ على Arabic-first وRTL-first وبدون تنفيذ Auth أو API أو منطق منتج فعلي.

## اختيار مكتبة التنقل

تم اختيار React Navigation لأنه يناسب الهيكل الحالي feature-based تحت `src/` ويوفر تحكما typed واضحا للتدفقات القادمة:

- Public flow.
- Student setup flow.
- Main app tabs.
- Nested stacks.
- Shared future screens.

لم تتم إضافة Expo Router في هذه المرحلة.

## الاعتماديات المثبتة

- `@react-navigation/native`
- `@react-navigation/native-stack`
- `@react-navigation/bottom-tabs`
- `react-native-screens`
- `react-native-safe-area-context`

تم تثبيت `react-native-screens` و`react-native-safe-area-context` عبر `npx expo install` لاختيار نسخ متوافقة مع Expo SDK 56.

## تصميم Root Flow

يوجد selector تطويري مؤقت في:

```ts
src / navigation / config / initialFlow.ts;
```

القيمة الحالية:

```ts
export const INITIAL_ROOT_FLOW = 'public';
```

القيم المدعومة:

- `public`
- `studentSetup`
- `app`

هذا ليس auth state ولا يستخدم storage أو tokens. الهدف فقط عرض تدفق واحد أثناء التطوير حتى يتم بناء auth الحقيقي في مرحلة لاحقة.

## بنية التنقل

```txt
RootNavigator
├── PublicStack
├── StudentSetupStack
└── AppTabs
    ├── HomeStack
    ├── SubjectsStack
    ├── GroupsStack
    ├── PrintingStack
    └── ProfileStack
```

## Route Types

تم تعريف typed param lists في:

```txt
src/navigation/types.ts
```

وتشمل:

- `PublicStackParamList`
- `StudentSetupStackParamList`
- `HomeStackParamList`
- `SubjectsStackParamList`
- `GroupsStackParamList`
- `PrintingStackParamList`
- `ProfileStackParamList`
- `SharedStackParamList`
- `AppTabsParamList`
- `RootStackParamList`

الشاشات المستقبلية التي تحتاج معرفات تستخدم params typed مثل `subjectId` و`groupId` و`orderId` و`ticketId` و`fileId`.

## Route Constants

تم تعريف route constants في:

```txt
src/navigation/routes.ts
```

ولا يجب استخدام route strings عشوائية خارج هذه الثوابت عند بناء التنقل الفعلي في المراحل القادمة.

## Placeholder Screens

تم إنشاء شاشات placeholder لكل شاشات MVP المخططة. كل شاشة تستخدم:

- `PlaceholderScreen`
- `AppScreen`
- `AppHeader`
- `AppCard`
- `AppText`
- `AppBadge`

المكون المشترك موجود في:

```txt
src/components/layout/PlaceholderScreen.tsx
```

كل placeholder يعرض اسم route ونصا عربيا قصيرا فقط، بدون API أو state أو منطق منتج.

## Guards

تمت إضافة placeholder guards في:

```txt
src/navigation/guards/navigationGuards.ts
```

هذه القيم ثابتة ومقصودة كمرجع مستقبلي فقط. لم يتم بناء auth guards حقيقية لأن Phase 3 لا تشمل Auth أو backend.

## ما لم يتم تنفيذه عمدا

- لا يوجد auth state.
- لا يوجد token check.
- لا يوجد AsyncStorage أو SecureStore.
- لا يوجد Zustand أو TanStack Query.
- لا يوجد API Client.
- لا يوجد PDF viewer package.
- لا توجد أيقونات tab خارجية.
- لا توجد شاشات منتج فعلية.
- لم يتم تشغيل Expo dev server أو Metro.

## التحقق

آخر تشغيل محلي بعد تنفيذ Phase 3:

- `npm run typecheck`: نجح.
- `npm run lint`: نجح.
- `npm run format:check`: نجح بعد تشغيل `npm run format`.
- `npm run expo:config`: نجح.
- `npm run validate`: نجح، ويشمل typecheck وlint وformat:check وexpo:config.
- `npm audit`: نجح، 0 vulnerabilities.
- `npm audit --omit=dev`: نجح، 0 production vulnerabilities.
- لم يتم تشغيل Expo dev server أو Metro أو emulator أو EAS build ضمن Phase 3.

## طريقة استخدام Phase 3 مستقبلا

- أضف أي route جديد إلى `routes.ts` أولا.
- أضف params في `types.ts` بدون استخدام `any`.
- أضف الشاشة داخل feature folder المناسب.
- اربط الشاشة بالـ stack المناسب فقط.
- لا تضف auth guards حقيقية قبل Phase auth.
- لا تضف API calls داخل الشاشات.
