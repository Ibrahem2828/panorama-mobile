import type { ReactNode } from 'react';
import type { ImageSourcePropType } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';

import type { ErrorKind } from '../../api/errorKind';
import { useNetworkStore } from '../../offline/networkStore';
import { spacing } from '../../theme';
import { AppButton, AppText } from '../common';
import type { ArtworkKey } from '../media';
import { BrandErrorArt, StateIllustration } from '../media';
import { useTranslation } from '../../i18n';

type LegacyKind = 'network' | 'permission' | 'sessionExpired' | 'maintenance';
type ErrorStateKind = ErrorKind | LegacyKind;

const BRAND_KINDS: readonly ErrorStateKind[] = [
  'offline',
  'weak',
  'timeout',
  'notFound',
  'server',
  'generic',
];

type ErrorStateProps = {
  title?: string;
  message?: string;
  /** Used instead of the kind's own line when the kind is generic or unknown (the screen's own failure text). */
  fallbackMessage?: string;
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
  fallbackMessage,
  retryLabel,
  onRetry,
  icon,
  artwork,
  illustrationSource,
  illustrationLabel,
  kind,
  style,
}: ErrorStateProps) {
  const { t } = useTranslation();
  const isOnline = useNetworkStore((state) => state.isOnline);
  // Without an explicit kind, a device that is offline is the most useful thing to say.
  const resolvedKind: ErrorStateKind | undefined = kind ?? (isOnline ? undefined : 'offline');
  const brandKind: ErrorKind | null =
    resolvedKind === 'network'
      ? 'weak'
      : resolvedKind && BRAND_KINDS.includes(resolvedKind)
        ? (resolvedKind as ErrorKind)
        : null;
  // An explicit title/message always wins; the kind's own copy fills in whatever the caller left out.
  const kindCopy = brandKind ? t.errorStates[brandKind] : null;
  const resolvedTitle = title ?? kindCopy?.title ?? t.common.errorTitle;
  const resolvedMessage =
    message ??
    (brandKind && brandKind !== 'generic'
      ? kindCopy?.message
      : (fallbackMessage ?? kindCopy?.message));
  const resolvedRetryLabel = retryLabel ?? t.common.retry;
  // The brand artwork is the default; callers that bring their own artwork, bitmap or icon keep it.
  const useBrandArt = !artwork && !illustrationSource && !icon;
  const resolvedArtwork: ArtworkKey | undefined = useBrandArt ? undefined : artwork;

  return (
    <View style={[styles.container, style]}>
      {useBrandArt ? (
        <BrandErrorArt kind={brandKind ?? 'generic'} width={168} />
      ) : resolvedArtwork || illustrationSource ? (
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
        {resolvedMessage ? (
          <AppText align="center" color="secondary" variant="bodySmall">
            {resolvedMessage}
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
