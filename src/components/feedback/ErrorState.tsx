import type { ReactNode } from 'react';
import type { ImageSourcePropType } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';

import { images } from '../../assets/images';
import { colors, spacing } from '../../theme';
import { AppButton, AppText } from '../common';
import { StateIllustration } from '../media';

type ErrorStateKind = 'network' | 'server' | 'permission' | 'sessionExpired' | 'maintenance';

type ErrorStateProps = {
  title?: string;
  message?: string;
  retryLabel?: string;
  onRetry?: () => void;
  icon?: ReactNode;
  illustrationSource?: ImageSourcePropType;
  illustrationLabel?: string;
  kind?: ErrorStateKind;
  style?: StyleProp<ViewStyle>;
};

export function ErrorState({
  title = 'حدث خطأ',
  message,
  retryLabel = 'إعادة المحاولة',
  onRetry,
  icon,
  illustrationSource,
  illustrationLabel,
  kind = 'server',
  style,
}: ErrorStateProps) {
  const resolvedIllustration = illustrationSource ?? images.errors[kind];

  return (
    <View style={[styles.container, style]}>
      {resolvedIllustration ? (
        <StateIllustration
          accessibilityLabel={illustrationLabel ?? title}
          compact
          source={resolvedIllustration}
        />
      ) : (
        icon
      )}
      <View style={styles.textBlock}>
        <AppText align="center" color="error" variant="title">
          {title}
        </AppText>
        {message ? (
          <AppText align="center" color="secondary" variant="bodySmall">
            {message}
          </AppText>
        ) : null}
      </View>
      {onRetry ? <AppButton onPress={onRetry} title={retryLabel} variant="outline" /> : null}
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
    backgroundColor: colors.semantic.errorSoft,
  },
  textBlock: {
    gap: spacing.xs,
  },
});
