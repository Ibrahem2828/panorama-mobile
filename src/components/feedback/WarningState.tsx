import type { ReactNode } from 'react';
import type { ImageSourcePropType } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '../../theme';
import { AppText } from '../common';
import type { ArtworkKey } from '../media';
import { StateIllustration } from '../media';

type WarningStateProps = {
  title: string;
  message?: string;
  action?: ReactNode;
  icon?: ReactNode;
  artwork?: ArtworkKey;
  illustrationSource?: ImageSourcePropType;
  illustrationLabel?: string;
  style?: StyleProp<ViewStyle>;
};

export function WarningState({
  title,
  message,
  action,
  icon,
  artwork,
  illustrationSource,
  illustrationLabel,
  style,
}: WarningStateProps) {
  const resolvedArtwork: ArtworkKey | undefined =
    artwork ?? (illustrationSource || icon ? undefined : 'warning');

  return (
    <View style={[styles.container, style]}>
      {resolvedArtwork || illustrationSource ? (
        <StateIllustration
          accessibilityLabel={illustrationLabel ?? title}
          artwork={resolvedArtwork}
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
    borderRadius: radius.card,
    backgroundColor: colors.semantic.warningSoft,
  },
  textBlock: {
    gap: spacing.xs,
    maxWidth: 360,
  },
});
