import { AppBadge, AppCard, AppText, Stack } from '../../../components';

const ACTIVE_OPTIONS = [
  'أبيض وأسود أو ملون',
  'وجه واحد أو وجهين',
  'حجم الورق',
  'التجليد والتسليك',
  'نقطة الاستلام',
];

export function PrintingFutureOptionsCard() {
  return (
    <AppCard variant="muted">
      <Stack gap="sm">
        <AppText variant="title">تسعير آمن ومرن</AppText>
        <AppText color="secondary" variant="bodySmall">
          تُرسل خياراتك فقط إلى الخادم، ثم يحسب Backend بانوراما السعر النهائي ويحفظ نسخة من قواعد
          التسعير المستخدمة. لا يعتمد التطبيق أي سعر محسوب على الجهاز.
        </AppText>
        <Stack direction="horizontal" gap="sm" wrap>
          {ACTIVE_OPTIONS.map((option) => (
            <AppBadge key={option} label={option} variant="neutral" />
          ))}
        </Stack>
      </Stack>
    </AppCard>
  );
}
