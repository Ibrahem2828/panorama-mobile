import { AppBadge, AppCard, AppText, Stack } from '../../../components';
import { useTranslation } from '../../../i18n';

export function PrintingFutureOptionsCard() {
  const { t } = useTranslation();

  return (
    <AppCard variant="muted">
      <Stack gap="sm">
        <AppText variant="title">{t.printing.futureOptions.title}</AppText>
        <AppText color="secondary" variant="bodySmall">
          {t.printing.futureOptions.description}
        </AppText>
        <Stack direction="horizontal" gap="sm" wrap>
          {t.printing.futureOptions.items.map((option) => (
            <AppBadge key={option} label={option} variant="neutral" />
          ))}
        </Stack>
      </Stack>
    </AppCard>
  );
}
