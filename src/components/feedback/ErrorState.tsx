import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';

import { spacing } from '../../theme';
import { AppButton, AppText } from '../common';

type ErrorStateProps = {
  title?: string;
  message?: string;
  retryLabel?: string;
  onRetry?: () => void;
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function ErrorState({
  title = 'حدث خطأ غير متوقع',
  message,
  retryLabel = 'إعادة المحاولة',
  onRetry,
  icon,
  style,
}: ErrorStateProps) {
  return (
    <View style={[styles.container, style]}>
      {icon}
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
  },
  textBlock: {
    gap: spacing.xs,
  },
});
