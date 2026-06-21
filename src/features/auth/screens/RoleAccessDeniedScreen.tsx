import { StyleSheet } from 'react-native';

import { AppButton, AppScreen, AppText, ErrorState, Stack } from '../../../components';
import { colors, spacing } from '../../../theme';
import { env } from '../../../config/env';
import { useAuthStore } from '../store';

export function RoleAccessDeniedScreen() {
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
          message="تطبيق بانوراما للجوال مخصص للطلاب. يرجى استخدام لوحة التحكم للمهام الإدارية."
          title="لا يمكن الوصول إلى التطبيق"
        />
        <AppText align="center" color="secondary" variant="bodySmall">
          لوحة التحكم:
        </AppText>
        <AppText align="center" color="primary" variant="bodySmall">
          {env.dashboardUrl}
        </AppText>
        <AppButton
          disabled={isSubmitting}
          loading={isSubmitting}
          onPress={handleLogout}
          title="تسجيل الخروج"
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
