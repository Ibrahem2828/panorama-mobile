import Constants from 'expo-constants';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet } from 'react-native';

import { AppHeader, AppScreen, AppText, Stack } from '../../../components';
import { env } from '../../../config/env';
import { useTranslation, type TranslationCatalog } from '../../../i18n';
import { ProfileRoutes } from '../../../navigation/routes';
import type { ProfileStackParamList } from '../../../navigation/types';
import { spacing } from '../../../theme';
import { LanguageSelector, SettingsOptionRow, SettingsSection } from '../components';

type SettingsScreenProps = NativeStackScreenProps<ProfileStackParamList, 'Settings'>;

const APP_VERSION = Constants.expoConfig?.version ?? '0.1.0';

function getEnvironmentLabel(t: TranslationCatalog): string {
  switch (env.appEnv) {
    case 'production':
      return t.environment.production;
    case 'preview':
      return t.environment.preview;
    default:
      return t.environment.development;
  }
}

export function SettingsScreen({ navigation }: SettingsScreenProps) {
  const { t } = useTranslation();
  const environmentLabel = getEnvironmentLabel(t);

  return (
    <AppScreen contentContainerStyle={styles.content} scroll>
      <Stack gap="xl">
        <AppHeader subtitle={t.settings.subtitle} title={t.settings.title} />

        <SettingsSection subtitle={t.settings.account.subtitle} title={t.settings.account.title}>
          <SettingsOptionRow
            description={t.settings.account.changePasswordDescription}
            onPress={() => navigation.navigate(ProfileRoutes.ChangePassword)}
            title={t.settings.account.changePassword}
          />
        </SettingsSection>

        <SettingsSection
          subtitle={t.settings.language.description}
          title={t.settings.language.title}
        >
          <LanguageSelector />
        </SettingsSection>

        <SettingsSection subtitle={t.settings.app.subtitle} title={t.settings.app.title}>
          <SettingsOptionRow
            description={t.settings.app.notificationsDescription}
            onPress={() => navigation.navigate(ProfileRoutes.Notifications)}
            title={t.settings.app.notifications}
          />
          <SettingsOptionRow
            description={t.settings.app.darkModeDescription}
            disabled
            title={t.settings.app.darkMode}
            value={t.common.comingSoon}
          />
          <SettingsOptionRow
            description={t.settings.app.versionDescription}
            disabled
            title={t.settings.app.version}
            value={APP_VERSION}
          />
          <SettingsOptionRow
            description={t.settings.app.environmentDescription}
            disabled
            title={t.settings.app.environment}
            value={environmentLabel}
          />
        </SettingsSection>

        <SettingsSection subtitle={t.settings.legal.subtitle} title={t.settings.legal.title}>
          <SettingsOptionRow
            onPress={() => navigation.navigate(ProfileRoutes.PrivacyPolicy)}
            title={t.settings.legal.privacy}
          />
          <SettingsOptionRow
            onPress={() => navigation.navigate(ProfileRoutes.Terms)}
            title={t.settings.legal.terms}
          />
          <SettingsOptionRow
            onPress={() => navigation.navigate(ProfileRoutes.About)}
            title={t.settings.legal.about}
          />
        </SettingsSection>

        <AppText align="center" color="muted" variant="caption">
          {t.appName} · {APP_VERSION} · {environmentLabel}
        </AppText>
      </Stack>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
  },
});
