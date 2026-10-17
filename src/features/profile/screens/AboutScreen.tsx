import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Constants from 'expo-constants';
import { Image, StyleSheet } from 'react-native';

import { AppCard, AppHeader, AppScreen, AppText, Stack } from '../../../components';
import { useTranslation } from '../../../i18n';
import type { ProfileStackParamList } from '../../../navigation/types';
import { spacing, useBrand } from '../../../theme';
import { LegalContentBlock } from '../components';

type AboutScreenProps = NativeStackScreenProps<ProfileStackParamList, 'About'>;

export function AboutScreen(_props: AboutScreenProps) {
  const { t } = useTranslation();
  const brand = useBrand();
  const appVersion = Constants.expoConfig?.version ?? t.common.notAvailable;

  return (
    <AppScreen contentContainerStyle={styles.content} scroll>
      <Stack gap="xl">
        <AppHeader subtitle={t.profile.about.subtitle} title={t.profile.about.title} />

        <AppCard padding="lg" variant="elevated">
          <Stack align="center" gap="sm">
            <Image
              accessibilityIgnoresInvertColors
              resizeMode="contain"
              source={brand.logo}
              style={styles.logo}
            />
            <AppText align="center" variant="h2">
              {t.appName}
            </AppText>
            <AppText align="center" color="secondary" variant="bodySmall">
              {t.profile.about.version(appVersion)}
            </AppText>
          </Stack>
        </AppCard>

        <LegalContentBlock
          paragraphs={t.profile.about.purpose}
          title={t.profile.about.purposeTitle}
        />
      </Stack>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  logo: {
    width: 120,
    height: 80,
  },
  content: {
    gap: spacing.xl,
  },
});
