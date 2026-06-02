import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';

import { spacing } from '../../theme';
import { AppButton, AppText } from '../common';

type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  action?: ReactNode;
  onActionPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

export function SectionHeader({
  title,
  subtitle,
  actionLabel,
  action,
  onActionPress,
  style,
}: SectionHeaderProps) {
  const resolvedAction =
    action ??
    (actionLabel && onActionPress ? (
      <AppButton onPress={onActionPress} size="sm" title={actionLabel} variant="ghost" />
    ) : null);

  return (
    <View style={[styles.container, style]}>
      <View style={styles.titleBlock}>
        <AppText variant="title">{title}</AppText>
        {subtitle ? (
          <AppText color="secondary" variant="bodySmall">
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {resolvedAction}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  titleBlock: {
    flex: 1,
    gap: spacing.xs,
  },
});
