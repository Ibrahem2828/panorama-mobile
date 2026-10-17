import { useEffect, useState } from 'react';
import { Appearance, StyleSheet, View } from 'react-native';

import { AppText, Icon, ListRow, type IconName } from '../../../components';
import { useTranslation } from '../../../i18n';
import {
  THEME_PREFERENCES,
  colors,
  radius,
  resolvedScheme,
  saveThemePreference,
  spacing,
  themePreference,
  useBrand,
  type ThemePreference,
} from '../../../theme';
import { resolveScheme } from '../../../theme/colorScheme';

const OPTION_ICONS: Record<ThemePreference, IconName> = {
  system: 'settings',
  light: 'eye',
  dark: 'eyeOff',
};

/**
 * Colours are fixed when the app starts (stylesheets are built at load), so a change is saved at once and
 * takes effect after a restart. The same notice appears if the phone's theme flips while the app runs and
 * the preference follows the system.
 */
export function ThemeSelector() {
  const { t } = useTranslation();
  const brand = useBrand();
  const [selected, setSelected] = useState<ThemePreference>(themePreference);
  const [systemScheme, setSystemScheme] = useState(() => Appearance.getColorScheme());

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) =>
      setSystemScheme(colorScheme),
    );
    return () => subscription.remove();
  }, []);

  const labels: Record<ThemePreference, string> = {
    system: t.settings.theme.system,
    light: t.settings.theme.light,
    dark: t.settings.theme.dark,
  };

  const nextScheme =
    selected === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : resolveScheme(selected);
  const needsRestart = nextScheme !== resolvedScheme;

  function choose(option: ThemePreference) {
    setSelected(option);
    saveThemePreference(option);
  }

  return (
    <View>
      {THEME_PREFERENCES.map((option, index) => (
        <View key={option}>
          {index > 0 ? <View style={styles.divider} /> : null}
          <ListRow
            icon={OPTION_ICONS[option]}
            onPress={option === selected ? undefined : () => choose(option)}
            title={labels[option]}
            tone={option === selected ? 'brand' : 'neutral'}
            trailing={
              option === selected ? (
                <Icon color={brand.primary} name="check" size={20} />
              ) : undefined
            }
          />
        </View>
      ))}

      {needsRestart ? (
        <View style={[styles.notice, { backgroundColor: brand.primarySoft }]}>
          <AppText color="secondary" variant="bodySmall">
            {t.settings.theme.restartRequired}
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
