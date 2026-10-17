import type { ReactNode } from 'react';
import type { ImageSourcePropType } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';

import { spacing } from '../../theme';
import { AppText } from '../common';
import type { ArtworkKey } from '../media';
import { StateIllustration } from '../media';

type EmptyStateProps = {
  title: string;
  message?: string;
  icon?: ReactNode;
  /** Icon artwork, rendered in the student's brand colour. */
  artwork?: ArtworkKey;
  /** Legacy bitmap artwork, only for flows that still ship their own images. */
  illustrationSource?: ImageSourcePropType;
  illustrationLabel?: string;
  action?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function EmptyState({
  title,
  message,
  icon,
  artwork,
  illustrationSource,
  illustrationLabel,
  action,
  style,
}: EmptyStateProps) {
  return (
    <View style={[styles.container, style]}>
      {artwork || illustrationSource ? (
        <StateIllustration
          accessibilityLabel={illustrationLabel ?? title}
          artwork={artwork}
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
    paddingHorizontal: spacing.lg,
  },
  textBlock: {
    gap: spacing.xs,
    maxWidth: 360,
  },
});
