import Constants from 'expo-constants';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet } from 'react-native';

import { AppHeader, AppScreen, AppText, Stack } from '../../../components';
import { env } from '../../../config/env';
import { useTranslation, type TranslationCatalog } from '../../../i18n';
import { ProfileRoutes } from '../../../navigation/routes';
import { openLegalPage } from '../../profile/services';
import type { ProfileStackParamList } from '../../../navigation/types';
import { spacing } from '../../../theme';
import { LanguageSelector, SettingsOptionRow, SettingsSection, ThemeSelector } from '../components';

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

  async function openLegalOrScreen(kind: 'privacy' | 'terms') {
    // The standalone page is the authoritative text; the built-in summary is the fallback.
    if (!(await openLegalPage(kind))) {
      navigation.navigate(kind === 'privacy' ? ProfileRoutes.PrivacyPolicy : ProfileRoutes.Terms);
    }
  }

  return (
    <AppScreen contentContainerStyle={styles.content} scroll>
      <Stack gap="xl">
        <AppHeader subtitle={t.settings.subtitle} title={t.settings.title} />

        <SettingsSection subtitle={t.settings.account.subtitle} title={t.settings.account.title}>
          <SettingsOptionRow
            description={t.settings.account.changePasswordDescription}
            onPress={() => navigation.navigate(ProfileRoutes.ChangePassword)}
            icon="lock"
            title={t.settings.account.changePassword}
          />
          <SettingsOptionRow
            description={t.settings.account.deleteAccountDescription}
            onPress={() => navigation.navigate(ProfileRoutes.DeleteAccount)}
            icon="trash"
            tone="error"
            title={t.settings.account.deleteAccount}
          />
        </SettingsSection>

        <SettingsSection
          subtitle={t.settings.language.description}
          title={t.settings.language.title}
        >
          <LanguageSelector />
        </SettingsSection>

        <SettingsSection subtitle={t.settings.theme.description} title={t.settings.theme.title}>
          <ThemeSelector />
        </SettingsSection>

        <SettingsSection subtitle={t.settings.app.subtitle} title={t.settings.app.title}>
          <SettingsOptionRow
            description={t.settings.app.notificationsDescription}
            onPress={() => navigation.navigate(ProfileRoutes.Notifications)}
            icon="bell"
            title={t.settings.app.notifications}
          />
          <SettingsOptionRow
            description={t.settings.app.versionDescription}
            disabled
            icon="tag"
            title={t.settings.app.version}
            value={APP_VERSION}
          />
          <SettingsOptionRow
            description={t.settings.app.environmentDescription}
            disabled
            icon="settings"
            title={t.settings.app.environment}
            value={environmentLabel}
          />
        </SettingsSection>

        <SettingsSection subtitle={t.settings.legal.subtitle} title={t.settings.legal.title}>
          <SettingsOptionRow
            onPress={() => openLegalOrScreen('privacy')}
            icon="shield"
            title={t.settings.legal.privacy}
          />
          <SettingsOptionRow
            onPress={() => openLegalOrScreen('terms')}
            icon="file"
            title={t.settings.legal.terms}
          />
          <SettingsOptionRow
            onPress={() => navigation.navigate(ProfileRoutes.About)}
            icon="info"
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
