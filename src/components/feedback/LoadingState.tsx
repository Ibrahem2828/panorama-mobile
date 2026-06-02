import type { StyleProp, ViewStyle } from 'react-native';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { colors, spacing } from '../../theme';
import { AppText } from '../common';

type LoadingStateProps = {
  message?: string;
  centered?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function LoadingState({
  message = 'جاري التحميل...',
  centered = false,
  style,
}: LoadingStateProps) {
  return (
    <View style={[styles.container, centered ? styles.centered : null, style]}>
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
  },
  centered: {
    flex: 1,
  },
});
