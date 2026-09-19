import { StyleSheet } from 'react-native';

import { images } from '../../../assets/images';
import { AppScreen, AppText, Illustration, Stack } from '../../../components';
import { spacing } from '../../../theme';
import { useTranslation } from '../../../i18n';

export function SplashScreen() {
  const { t } = useTranslation();
  return (
    <AppScreen contentContainerStyle={styles.content} safeArea>
      <Stack gap="xl" style={styles.center}>
        <Illustration
          accessibilityLabel={t.auth.logoAlt}
          size="xl"
          source={images.brand.logoFullAr}
        />
        <Stack gap="sm">
          <AppText align="center" variant="h1">
            {t.appName}
          </AppText>
          <AppText align="center" color="secondary" variant="body">
            {t.onboarding.appTagline}
          </AppText>
        </Stack>
      </Stack>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, padding: spacing.xl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
