import { AppBadge, AppCard, AppText, Stack } from '../../../components';

const FUTURE_OPTIONS = ['الألوان', 'وجه واحد/وجهين', 'التجليد', 'حجم الورق', 'السعر'];

export function PrintingFutureOptionsCard() {
  return (
    <AppCard variant="muted">
      <Stack gap="sm">
        <AppText variant="title">خيارات إضافية</AppText>
        <AppText color="secondary" variant="bodySmall">
          هذه الخيارات غير متاحة حالياً. ستتوفر في تحديثات قادمة.
        </AppText>
        <Stack direction="horizontal" gap="sm" wrap>
          {FUTURE_OPTIONS.map((option) => (
            <AppBadge key={option} label={option} variant="neutral" />
          ))}
        </Stack>
      </Stack>
    </AppCard>
  );
}
