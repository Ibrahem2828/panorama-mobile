# Phase 1 Project Initialization

## هدف المرحلة

هدف Phase 1 هو تحويل مجلد `panorama-mobile` من وثائق فقط إلى مشروع Expo + React Native + TypeScript قابل للتشغيل، مع تجهيز البنية الأساسية للمجلدات والإعدادات دون بناء الشاشات الحقيقية أو الربط الفعلي مع API.

## ما تم إنشاؤه

- مشروع Expo داخل نفس المجلد.
- `package.json` مع scripts واضحة للتشغيل والتحقق والبناء عبر EAS لاحقا.
- `app.config.ts` لإعداد Expo.
- `tsconfig.json` مع TypeScript strict mode.
- `.env.example` دون أسرار.
- `eas.json` لبيئات development وpreview وproduction.
- بنية `src/` المعتمدة في Phase 0.
- theme tokens أساسية للألوان والمسافات والحواف والخطوط.
- i18n عربي تمهيدي.
- RTL utility تمهيدي.
- `AppProviders` بسيط.
- شاشة تمهيدية بسيطة تؤكد جاهزية Phase 1.

## بنية المشروع

```txt
src/
├── api/
├── assets/
├── components/
├── config/
├── constants/
├── features/
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

كل مجلد يحتوي README مختصر يوضح مسؤوليته، مع `.gitkeep` للمجلدات التمهيدية التي لا تحتوي كودا بعد.

## طريقة التشغيل

```bash
npm install
npm run start
```

لتشغيل Android:

```bash
npm run android
```

## السكربتات

| السكربت                    | الغرض                                        |
| -------------------------- | -------------------------------------------- |
| `npm run start`            | تشغيل Expo dev server.                       |
| `npm run android`          | تشغيل المشروع على Android.                   |
| `npm run ios`              | تشغيل المشروع على iOS عند الحاجة.            |
| `npm run web`              | تشغيل نسخة web عند الحاجة.                   |
| `npm run typecheck`        | التحقق من TypeScript دون إخراج ملفات.        |
| `npm run lint`             | تشغيل ESLint.                                |
| `npm run format`           | تنسيق الملفات عبر Prettier.                  |
| `npm run format:check`     | التحقق من التنسيق.                           |
| `npm run build:preview`    | بناء Android APK عبر EAS profile preview.    |
| `npm run build:production` | بناء Android AAB عبر EAS profile production. |

## متغيرات البيئة

```txt
EXPO_PUBLIC_APP_ENV
EXPO_PUBLIC_API_BASE_URL
EXPO_PUBLIC_WS_BASE_URL
```

القيم النموذجية موجودة في `.env.example`. لا يجب إنشاء `.env` يحتوي أسرارا داخل المستودع.

## EAS profiles

- `development`: نسخة داخلية مع development client وAndroid APK.
- `preview`: نسخة داخلية Android APK.
- `production`: نسخة إنتاج Android AAB.

## ما لم يتم تنفيذه بعد

- لا توجد شاشات Login أو Register أو Home.
- لا يوجد Navigation كامل.
- لا يوجد API Client فعلي.
- لا يوجد Auth logic.
- لا يوجد WebSocket.
- لا يوجد PDF Viewer.
- لا يوجد Design System كامل.
- لا توجد خدمات طباعة.
- لا توجد خطوط أو صور نهائية.

## معايير قبول Phase 1

- المشروع يعمل كبداية Expo نظيفة.
- TypeScript يمر دون أخطاء.
- lint يمر دون أخطاء.
- وثائق Phase 0 محفوظة.
- `src/` موجودة وتحتوي البنية المطلوبة.
- الإعدادات الأساسية لـ Expo وEAS والبيئة موجودة.
- الشاشة التمهيدية بسيطة ولا تمثل شاشة منتج حقيقية.

## المرحلة التالية

المرحلة التالية هي **Phase 2 Design System**، وفيها يتم بناء مكونات الهوية البصرية بشكل منظم اعتمادا على tokens الحالية ووثيقة الهوية البصرية.
