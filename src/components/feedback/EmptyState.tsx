import type { ReactNode } from 'react';
import type { ImageSourcePropType } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';

import { spacing } from '../../theme';
import { AppText } from '../common';
import { StateIllustration } from '../media';

type EmptyStateProps = {
  title: string;
  message?: string;
  icon?: ReactNode;
  illustrationSource?: ImageSourcePropType;
  illustrationLabel?: string;
  action?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function EmptyState({
  title,
  message,
  icon,
  illustrationSource,
  illustrationLabel,
  action,
  style,
}: EmptyStateProps) {
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
        <AppText align="center" variant="title">
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
  },
  textBlock: {
    gap: spacing.xs,
  },
});
