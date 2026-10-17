import type { ReactNode } from 'react';
import type { ImageSourcePropType } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';

import { spacing } from '../../theme';
import { AppButton, AppText } from '../common';
import type { ArtworkKey } from '../media';
import { StateIllustration } from '../media';
import { useTranslation } from '../../i18n';

type ErrorStateKind = 'network' | 'server' | 'permission' | 'sessionExpired' | 'maintenance';

type ErrorStateProps = {
  title?: string;
  message?: string;
  retryLabel?: string;
  onRetry?: () => void;
  icon?: ReactNode;
  artwork?: ArtworkKey;
  illustrationSource?: ImageSourcePropType;
  illustrationLabel?: string;
  kind?: ErrorStateKind;
  style?: StyleProp<ViewStyle>;
};

export function ErrorState({
  title,
  message,
  retryLabel,
  onRetry,
  icon,
  artwork,
  illustrationSource,
  illustrationLabel,
  kind = 'server',
  style,
}: ErrorStateProps) {
  const { t } = useTranslation();
  const resolvedTitle = title ?? t.common.errorTitle;
  const resolvedRetryLabel = retryLabel ?? t.common.retry;
  const resolvedArtwork: ArtworkKey | undefined =
    artwork ?? (illustrationSource || icon ? undefined : kind === 'network' ? 'network' : 'error');

  return (
    <View style={[styles.container, style]}>
      {resolvedArtwork || illustrationSource ? (
        <StateIllustration
          accessibilityLabel={illustrationLabel ?? resolvedTitle}
          artwork={resolvedArtwork}
          compact
          source={illustrationSource}
        />
      ) : (
        icon
      )}
      <View style={styles.textBlock}>
        <AppText align="center" variant="title">
          {resolvedTitle}
        </AppText>
        {message ? (
          <AppText align="center" color="secondary" variant="bodySmall">
            {message}
          </AppText>
        ) : null}
      </View>
      {onRetry ? (
        <AppButton onPress={onRetry} title={resolvedRetryLabel} variant="outline" />
      ) : null}
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
