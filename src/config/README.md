# config

إعدادات عامة آمنة للتطبيق.

`env.ts` يقرأ قيم Expo العامة:

- `EXPO_PUBLIC_APP_ENV`
- `EXPO_PUBLIC_API_BASE_URL`
- `EXPO_PUBLIC_WS_BASE_URL`

ويصدر `env` و`validateClientEnv`. لا توجد أسرار أو tokens هنا، ولا يتم إيقاف التطبيق عند غياب الباك إند المحلي.
