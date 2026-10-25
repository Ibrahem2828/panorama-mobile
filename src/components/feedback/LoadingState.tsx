import type { StyleProp, ViewStyle } from 'react-native';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { spacing, useBrand } from '../../theme';
import { AppText } from '../common';
import { useTranslation } from '../../i18n';
import { BrandedLoading } from './BrandedLoading';

type LoadingStateProps = {
  message?: string;
  title?: string;
  centered?: boolean;
  /** Boot-level screens: the brand/faculty logo with a gentle animation instead of a bare spinner. */
  branded?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function LoadingState({
  message,
  title,
  centered = false,
  branded = false,
  style,
}: LoadingStateProps) {
  const { t } = useTranslation();
  const brand = useBrand();

  if (branded) {
    return <BrandedLoading message={message ?? t.common.loading} title={title} />;
  }

  return (
    <View style={[styles.container, centered ? styles.centered : null, style]}>
      {title ? (
        <AppText align="center" variant="title">
          {title}
        </AppText>
      ) : null}
      <ActivityIndicator color={brand.primary} size="large" />
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
