import type { StyleProp, ViewStyle } from 'react-native';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { colors, spacing } from '../../theme';
import { AppText } from '../common';
import { useTranslation } from '../../i18n';

type LoadingStateProps = {
  message?: string;
  title?: string;
  centered?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function LoadingState({ message, title, centered = false, style }: LoadingStateProps) {
  const { t } = useTranslation();

  return (
    <View style={[styles.container, centered ? styles.centered : null, style]}>
      {title ? (
        <AppText align="center" variant="title">
          {title}
        </AppText>
      ) : null}
      <ActivityIndicator color={colors.brand.primary} size="large" />
      <AppText align="center" color="secondary" variant="bodySmall">
        {message ?? t.common.loading}
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
