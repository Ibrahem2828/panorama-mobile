import type { ReactNode } from 'react';
import type { ImageSourcePropType } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';

import { images } from '../../assets/images';
import { colors, spacing } from '../../theme';
import { AppText } from '../common';
import { StateIllustration } from '../media';

type WarningStateProps = {
  title: string;
  message?: string;
  action?: ReactNode;
  icon?: ReactNode;
  illustrationSource?: ImageSourcePropType;
  illustrationLabel?: string;
  style?: StyleProp<ViewStyle>;
};

export function WarningState({
  title,
  message,
  action,
  icon,
  illustrationSource = images.illustrations.warning,
  illustrationLabel,
  style,
}: WarningStateProps) {
  return (
    <View style={[styles.container, style]}>
      {illustrationSource ? (
        <StateIllustration
          accessibilityLabel={illustrationLabel ?? title}
          compact
          source={illustrationSource}
        />
      ) : (
        icon
      )}
      <View style={styles.textBlock}>
        <AppText align="center" color="warning" variant="title">
          {title}
        </AppText>
        {message ? (
          <AppText align="center" color="secondary" variant="bodySmall">
            {message}
          </AppText>
        ) : null}
      </View>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.semantic.warningSoft,
  },
  textBlock: {
    gap: spacing.xs,
  },
});
