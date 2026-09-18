import { StyleSheet } from 'react-native';

import { AppButton, AppScreen, AppText, ErrorState, Stack } from '../../../components';
import { useTranslation } from '../../../i18n';
import { colors, spacing } from '../../../theme';
import { env } from '../../../config/env';
import { useAuthStore } from '../store';

export function RoleAccessDeniedScreen() {
  const { t } = useTranslation();
  const logout = useAuthStore((state) => state.logout);
  const isSubmitting = useAuthStore((state) => state.isSubmitting);

  async function handleLogout() {
    await logout();
  }

  return (
    <AppScreen>
      <Stack gap="lg" style={styles.content}>
        <ErrorState
          kind="permission"
          message={t.auth.roleDenied.message}
          title={t.auth.roleDenied.title}
        />
        <AppText align="center" color="secondary" variant="bodySmall">
          {t.auth.roleDenied.dashboardLabel}
        </AppText>
        <AppText align="center" color="primary" variant="bodySmall">
          {env.dashboardUrl}
        </AppText>
        <AppButton
          disabled={isSubmitting}
          loading={isSubmitting}
          onPress={handleLogout}
          title={t.auth.roleDenied.logout}
          variant="outline"
        />
      </Stack>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    backgroundColor: colors.background.primary,
  },
});
