import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Constants from 'expo-constants';
import { StyleSheet } from 'react-native';

import { AppCard, AppHeader, AppScreen, AppText, Stack } from '../../../components';
import { useTranslation } from '../../../i18n';
import type { ProfileStackParamList } from '../../../navigation/types';
import { spacing } from '../../../theme';
import { LegalContentBlock } from '../components';

type AboutScreenProps = NativeStackScreenProps<ProfileStackParamList, 'About'>;

export function AboutScreen(_props: AboutScreenProps) {
  const { t } = useTranslation();
  const appVersion = Constants.expoConfig?.version ?? t.common.notAvailable;

  return (
    <AppScreen contentContainerStyle={styles.content} scroll>
      <Stack gap="xl">
        <AppHeader subtitle={t.profile.about.subtitle} title={t.profile.about.title} />

        <AppCard padding="lg" variant="elevated">
          <Stack gap="sm">
            <AppText variant="h2">Panorama</AppText>
            <AppText color="secondary" variant="bodySmall">
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
  content: {
    gap: spacing.xl,
  },
});
