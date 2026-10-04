import { AppCard, AppText, Stack } from '../../../components';
import { useTranslation } from '../../../i18n';

export function NormalUserIntroCard() {
  const { t } = useTranslation();
  return (
    <AppCard padding="lg" variant="muted">
      <Stack gap="sm">
        <AppText variant="title">{t.studentProfile.intro.title}</AppText>
        <AppText color="secondary" variant="bodySmall">
          {t.studentProfile.intro.description}
        </AppText>
      </Stack>
    </AppCard>
  );
}
