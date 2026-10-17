import { NavigationContext } from '@react-navigation/native';
import type { ReactNode } from 'react';
import { useContext } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';

import { useTranslation } from '../../i18n';
import { colors, spacing } from '../../theme';
import { getIsRTL } from '../../utils/rtl';
import { AppIconButton, AppText } from '../common';
import { Icon } from '../icons';

type AppHeaderProps = {
  title: string;
  subtitle?: string;
  /**
   * Back button. `true` forces it, `false` hides it. By default it appears automatically when
   * the screen sits above another screen of its stack.
   */
  showBack?: boolean;
  /** Overrides what the back button does (defaults to navigation.goBack()). */
  onBack?: () => void;
  /** Custom start-side content; replaces the back button. */
  leftAction?: ReactNode;
  /** Trailing actions (icon buttons). */
  rightAction?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/**
 * Screen header: optional back button (chevron mirrored for RTL), title, optional subtitle and
 * trailing actions. Slots that are not used take no space.
 */
export function AppHeader({
  title,
  subtitle,
  showBack,
  onBack,
  leftAction,
  rightAction,
  style,
}: AppHeaderProps) {
  const { t } = useTranslation();
  const navigation = useContext(NavigationContext);

  const canGoBack = (() => {
    if (!navigation) {
      return false;
    }
    const state = navigation.getState();
    return state?.type === 'stack' && state.index > 0;
  })();
  const backVisible = leftAction ? false : (showBack ?? (canGoBack || onBack !== undefined));

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (navigation?.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <View style={[styles.container, style]}>
      {leftAction ?? null}
      {backVisible ? (
        <AppIconButton
          accessibilityLabel={t.common.back}
          icon={
            <Icon
              color={colors.text.primary}
              name={getIsRTL() ? 'chevronRight' : 'chevronLeft'}
              size={22}
            />
          }
          onPress={handleBack}
          shape="circle"
          size="sm"
          variant="surface"
        />
      ) : null}
      <View style={styles.titleBlock}>
        <AppText accessibilityRole="header" numberOfLines={2} variant={backVisible ? 'h3' : 'h2'}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText color="secondary" variant="bodySmall">
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {rightAction ? <View style={styles.trailing}>{rightAction}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  titleBlock: {
    flex: 1,
    gap: spacing.xxs,
  },
  trailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
