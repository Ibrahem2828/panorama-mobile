# Panorama Mobile

Panorama هو تطبيق موبايل عربي للطلاب الجامعيين. الهدف هو جمع المواد، الغروبات، المحادثات، الملفات، طلبات الطباعة، الإشعارات، الدعم الفني، والبيانات الأكاديمية داخل تجربة واحدة منظمة.

## حالة المشروع الحالية

الحالة الحالية: **Phase 4 API Client Foundation**.

تم تأسيس API Client foundation باستخدام `fetch` بدون اعتماديات إضافية. الطبقة الحالية تشمل typed request builder، response envelope handling، error normalization برسائل عربية، pagination helpers، endpoint constants، وخدمات API foundation غير مربوطة بالشاشات.

## ما تم إنجازه

- Phase 0: توثيق الرؤية، قرارات المنتج، نطاق MVP، الأدوار، الرحلات، المتطلبات، الهوية، API assumptions، واستراتيجية الإصدارات.
- Phase 1: إنشاء مشروع Expo + React Native + TypeScript وبنية `src/` الأساسية.
- Phase 1.6: إصلاح Expo config، TypeScript، ESLint، Prettier، audit، وسكربتات التحقق.
- Phase 2: تأسيس theme tokens ومكونات UI reusable وشاشة showcase ووثائق الاستخدام.
- Phase 3: تأسيس React Navigation architecture، route constants، typed params، navigators، placeholders، وroot flow selector.
- Phase 4: تأسيس API Client، endpoint map، response/error/pagination types، service foundations، وenv validation helpers.

## المتطلبات

- Node.js 20.19.4 أو أحدث.
- npm.
- Expo CLI عبر سكربتات npm.
- EAS CLI عبر `npx` عند الحاجة للبناء السحابي.

## إعدادات البيئة

القيم العامة فقط موجودة في `.env.example`:

```bash
EXPO_PUBLIC_APP_ENV=development
EXPO_PUBLIC_API_BASE_URL=http://localhost:8000
EXPO_PUBLIC_WS_BASE_URL=ws://localhost:8000
```

لا توجد أسرار أو tokens داخل env. تخزين tokens مؤجل إلى Phase Auth.

## أوامر التشغيل والتحقق

```bash
npm ci
npm run start
npm run typecheck
npm run lint
npm run format:check
npm run expo:config
npm run validate
npm audit
npm audit --omit=dev
```

لا يتم تشغيل Expo dev server ضمن مراحل التنفيذ الآلي إلا إذا طلب المستخدم ذلك صراحة.

## بنية API الحالية

```txt
src/api/
├── client.ts
├── endpoints.ts
├── errors.ts
├── http.ts
├── pagination.ts
├── request.ts
├── response.ts
├── types.ts
└── services/
```

## نطاق ما لم يتم تنفيذه بعد

التطبيق حاليا لا يحتوي على:

- Auth logic أو session storage.
- SecureStore أو refresh-token automation.
- TanStack Query أو Zustand.
- API calls من الشاشات.
- WebSocket.
- PDF Viewer حقيقي.
- خدمات طباعة فعلية.
- شاشات منتج حقيقية.

## المرحلة التالية

المرحلة التالية المقترحة هي **Phase 5 Authentication Foundation**، ويجب أن تبقى محصورة في تأسيس auth state/token handling بدون توسيع ميزات المنتج قبل أوانها.
