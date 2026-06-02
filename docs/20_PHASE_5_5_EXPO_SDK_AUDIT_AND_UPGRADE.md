# Phase 5.5 Expo SDK Audit & Safe Upgrade Decision

## الهدف

تدقيق حالة Expo SDK الفعلية قبل الانتقال إلى Phase 6، وحسم تعارض التوثيق السابق الذي ذكر SDK 56 بينما كان `expo:config` يعرض SDK 46.

هذه مرحلة جاهزية إنتاجية فقط. لم تتم إضافة ميزات منتج أو تعديل تدفق المصادقة أو التنقل.

## سبب المرحلة

بعد Phase 5 كان المشروع يمرر أوامر التحقق، لكن `npx expo config --type public` كان يعرض:

```txt
sdkVersion: 46.0.0
```

هذا خطر إنتاجي لأن SDK 46 يستهدف Android API قديم ولا يتوافق مع حزم React/React Native الحديثة الموجودة في المشروع.

## الحالة قبل التغيير

الأوامر التشخيصية قبل الترقية أظهرت:

- `node -p "require('./package.json').dependencies.expo"`: `^46.0.21`
- `node -p "require('./package.json').dependencies.react"`: `19.2.3`
- `node -p "require('./package.json').dependencies['react-native']"`: `0.85`
- `npx expo --version`: `0.3.3`
- `npx expo config --type public`: `sdkVersion: 46.0.0`
- `npm ls`: `expo@46.0.21`, `react@19.2.3`, `react-native@0.85.3`

## سبب تقرير SDK 46

السبب لم يكن حقلا صريحا داخل `app.config.ts`. لا يوجد `sdkVersion` في config.

السبب الحقيقي:

- `package.json` كان يحتوي `expo: ^46.0.21`.
- `package-lock.json` كان يقفل حزم Expo 46.
- Expo public config استنتج SDK 46 من حزمة `expo` المثبتة.
- توثيق Phase 3 الذي ذكر SDK 56 كان غير مطابق للحالة الفعلية بعد تثبيت Phase 5.

## نتائج الفحص قبل الترقية

`npx expo-doctor` قبل الترقية:

- 14/16 checks passed.
- فشل فحص جاهزية متطلبات المتاجر لأن SDK 46 يستهدف Android API 33 أو أقل.
- فشل فحص توافق الحزم لأن React/RN والحزم المدارة لا تطابق SDK 46.

`npx expo install --check` قبل الترقية:

- فشل.
- أظهر أن SDK 46 يتوقع:
  - `react@18.0.0`
  - `react-native@0.69.9`
  - `expo-status-bar@~1.4.0`
  - `react-native-safe-area-context@4.3.1`
  - `react-native-screens@~3.15.0`

الرجوع لهذه الإصدارات كان سيعني downgrade غير مناسب للإنتاج، لذلك تم اختيار الترقية.

## قرار الترقية

تم تنفيذ Option A: الترقية الآمنة إلى Expo SDK 56.

المسار:

1. محاولة `npx expo upgrade` فشلت لأن local CLI لا يدعم الأمر.
2. محاولة استخدام legacy `expo-cli upgrade --help` انتهت بـ timeout، والأداة حذرت أنها لا تدعم Node 17+ بشكل جيد.
3. تم التحقق من npm أن أحدث Expo مستقر هو `56.0.8`.
4. تم تثبيت `expo@~56.0.8`.
5. تم تشغيل `npx expo install --fix` لمحاذاة حزم Expo-managed.
6. تمت إضافة config plugins المطلوبة إلى `app.config.ts`.
7. تم تحديث TypeScript إلى النسخة المتوقعة لـ SDK 56.

## الحالة بعد التغيير

الإصدارات بعد الترقية:

- Expo package: `~56.0.8`
- Installed Expo: `56.0.8`
- Expo CLI: `56.1.13`
- Public config SDK: `56.0.0`
- React: `19.2.3`
- React Native package range: `0.85`
- Installed React Native: `0.85.3`
- Expo SecureStore: `~56.0.4`
- Expo Status Bar: `~56.0.4`
- TypeScript: `~6.0.3`

## توافق الحزم

`npx expo install --check` بعد الترقية:

```txt
Dependencies are up to date
```

`npx expo-doctor` بعد الترقية:

```txt
21/21 checks passed. No issues detected.
```

## تغييرات app.config.ts

تمت إعادة استخدام النوع الرسمي:

```ts
import type { ConfigContext, ExpoConfig } from 'expo/config';
```

وتمت إضافة plugins التي طلبها Expo:

```ts
plugins: ['expo-secure-store', 'expo-status-bar'];
```

لم تتم إضافة `sdkVersion` يدويا. SDK الظاهر في config يأتي من حزمة Expo المثبتة.

## فحص EAS

`eas.json` تمت مراجعته:

- development profile يستخدم internal distribution وAPK.
- preview profile يبني APK.
- production profile يبني AAB.
- لا توجد أسرار.
- env values عامة وآمنة.

لم يتم تشغيل EAS build.

## نتائج التحقق

- `npm run typecheck`: نجح.
- `npm run lint`: نجح.
- `npm run format:check`: نجح.
- `npm run expo:config`: نجح ويعرض `sdkVersion: 56.0.0`.
- `npm run validate`: نجح.
- `npm audit`: نجح، 0 vulnerabilities.
- `npm audit --omit=dev`: نجح، 0 production vulnerabilities.
- `npx expo config --type public`: نجح.
- `npx expo-doctor`: نجح، 21/21.
- `npx expo install --check`: نجح.
- `npm ls expo react react-native expo-secure-store react-native-screens react-native-safe-area-context @react-navigation/native zustand`: نجح ويعرض نسخ SDK 56 المتوافقة.

## ملاحظات متبقية

- لم يتم تشغيل Expo dev server.
- لم يتم تشغيل emulator.
- لم يتم تشغيل EAS build.
- لم يتم إنشاء `android/` أو `ios/`.
- لا توجد تحذيرات Expo doctor متبقية.
- لا توجد ثغرات audit متبقية.

## قرار الجاهزية الإنتاجية

المشروع أصبح على Expo SDK 56، وحزم Expo-managed متوافقة، وdoctor نظيف، وproduction audit نظيف.

المشروع جاهز للانتقال إلى Phase 6 Student Profile & Verification Foundation.
