import { StyleSheet, View } from 'react-native';

import { AppText, Icon, ListRow } from '../../../components';
import { LOCALES, useTranslation, type Locale } from '../../../i18n';
import { colors, radius, spacing, useBrand } from '../../../theme';

export function LanguageSelector() {
  const { t, locale, setLocale, needsRestartForDirection } = useTranslation();
  const brand = useBrand();

  const labels: Record<Locale, string> = {
    ar: t.settings.language.arabic,
    en: t.settings.language.english,
  };

  return (
    <View>
      {LOCALES.map((option, index) => (
        <View key={option}>
          {index > 0 ? <View style={styles.divider} /> : null}
          <ListRow
            icon="language"
            onPress={option === locale ? undefined : () => void setLocale(option)}
            title={labels[option]}
            tone={option === locale ? 'brand' : 'neutral'}
            trailing={
              option === locale ? <Icon color={brand.primary} name="check" size={20} /> : undefined
            }
          />
        </View>
      ))}

      {needsRestartForDirection ? (
        <View style={[styles.notice, { backgroundColor: brand.primarySoft }]}>
          <AppText color="secondary" variant="bodySmall">
            {t.settings.language.restartRequired}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: spacing.md,
    backgroundColor: colors.gray[200],
  },
  notice: {
    margin: spacing.md,
    borderRadius: radius.md,
    padding: spacing.md,
  },
});
