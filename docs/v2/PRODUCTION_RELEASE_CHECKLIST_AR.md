# بوابة إصدار Panorama Mobile v2

## P0 — يمنع الإصدار

- [ ] توليد ومراجعة `package-lock.json` جديد.
- [ ] `npm ci` ينجح.
- [ ] `npm run validate:release` ينجح.
- [ ] جميع Unit tests وIntegration tests ناجحة.
- [ ] Android preview وproduction build ناجحان.
- [ ] iOS build واختبار TestFlight ناجحان.
- [ ] تسجيل/OTP/استعادة كلمة المرور مجربة على SMTP الحقيقي.
- [ ] Student Setup والتوثيق مجربان من البداية للنهاية.
- [ ] الروابط المؤقتة للملفات وواتساب تنتهي ولا تعمل لغير المصرح.
- [ ] Quote والطباعة لا يقبلان سعرًا من العميل.
- [ ] Push Notifications مجربة على جهاز Android وiOS حقيقيين.
- [ ] سياسة الخصوصية والشروط وروابط الدعم نهائية.
- [ ] لا أسرار أو توكنات أو ملفات `.env` داخل المستودع.

## P1 — قبل الإطلاق العام

- [ ] E2E عبر Maestro أو Detox للرحلات الحرجة.
- [ ] Sentry وCrash reporting مع redaction.
- [ ] اختبارات شبكة بطيئة/انقطاع/إعادة اتصال.
- [ ] اختبار RTL وأحجام الخط وإمكانية الوصول.
- [ ] Pilot محدود وقياس crash-free sessions والرضا.
