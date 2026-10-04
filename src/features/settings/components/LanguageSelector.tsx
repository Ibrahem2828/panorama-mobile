import { StyleSheet, View } from 'react-native';

import { AppText, Stack } from '../../../components';
import { LOCALES, useTranslation, type Locale } from '../../../i18n';
import { colors, radius, spacing } from '../../../theme';
import { SettingsOptionRow } from './SettingsOptionRow';

export function LanguageSelector() {
  const { t, locale, setLocale, needsRestartForDirection } = useTranslation();

  const labels: Record<Locale, string> = {
    ar: t.settings.language.arabic,
    en: t.settings.language.english,
  };

  return (
    <Stack gap="sm">
      {LOCALES.map((option) => (
        <SettingsOptionRow
          badgeVariant={option === locale ? 'success' : 'neutral'}
          key={option}
          onPress={option === locale ? undefined : () => void setLocale(option)}
          title={labels[option]}
          value={option === locale ? '✓' : undefined}
        />
      ))}

      {needsRestartForDirection ? (
        <View style={styles.notice}>
          <AppText color="secondary" variant="bodySmall">
            {t.settings.language.restartRequired}
          </AppText>
        </View>
      ) : null}
    </Stack>
  );
}

const styles = StyleSheet.create({
  notice: {
    backgroundColor: colors.brand.primarySoft,
    borderRadius: radius.md,
    padding: spacing.md,
  },
});
