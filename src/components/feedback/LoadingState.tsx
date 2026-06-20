import type { StyleProp, ViewStyle } from 'react-native';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { colors, spacing } from '../../theme';
import { AppText } from '../common';

type LoadingStateProps = {
  message?: string;
  title?: string;
  centered?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function LoadingState({
  message = 'جاري التحميل...',
  title,
  centered = false,
  style,
}: LoadingStateProps) {
  return (
    <View style={[styles.container, centered ? styles.centered : null, style]}>
      {title ? (
        <AppText align="center" variant="title">
          {title}
        </AppText>
      ) : null}
      <ActivityIndicator color={colors.brand.primary} size="large" />
      <AppText align="center" color="secondary" variant="bodySmall">
        {message}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  centered: {
    flex: 1,
  },
});
