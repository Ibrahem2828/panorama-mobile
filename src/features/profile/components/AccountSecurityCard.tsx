import { AppButton, AppCard, AppText, Stack } from '../../../components';
import { useTranslation } from '../../../i18n';

type AccountSecurityCardProps = {
  onChangePassword: () => void;
};

export function AccountSecurityCard({ onChangePassword }: AccountSecurityCardProps) {
  const { t } = useTranslation();

  return (
    <AppCard variant="muted">
      <Stack gap="md">
        <Stack gap="xs">
          <AppText variant="title">{t.profile.security.title}</AppText>
          <AppText color="secondary" variant="bodySmall">
            {t.profile.security.description}
          </AppText>
        </Stack>
        <AppButton
          onPress={onChangePassword}
          title={t.profile.security.changePassword}
          variant="outline"
        />
      </Stack>
    </AppCard>
  );
}
