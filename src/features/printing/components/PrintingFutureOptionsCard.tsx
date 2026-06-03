import { AppBadge, AppCard, AppText, Stack } from '../../../components';

const FUTURE_OPTIONS = ['الألوان', 'وجه واحد/وجهين', 'التجليد', 'حجم الورق', 'السعر'];

export function PrintingFutureOptionsCard() {
  return (
    <AppCard variant="muted">
      <Stack gap="sm">
        <AppText variant="title">خيارات مستقبلية</AppText>
        <AppText color="secondary" variant="bodySmall">
          تظهر هذه الخيارات كتجهيز للواجهة فقط. لا يتم إرسالها مع طلب Phase 11.
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
