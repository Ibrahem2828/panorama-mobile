import { Pressable, StyleSheet } from 'react-native';

import { AppBadge, AppText, Stack } from '../../../components';
import { opacity, spacing } from '../../../theme';
import type { StatusVariant } from '../../../types/common';

type ProfileActionItemProps = {
  title: string;
  subtitle?: string;
  badge?: string;
  badgeVariant?: StatusVariant;
  disabled?: boolean;
  onPress?: () => void;
};

export function ProfileActionItem({
  title,
  subtitle,
  badge,
  badgeVariant = 'neutral',
  disabled = false,
  onPress,
}: ProfileActionItemProps) {
  const isDisabled = disabled || !onPress;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        pressed && !isDisabled ? styles.pressed : null,
        isDisabled ? styles.disabled : null,
      ]}
    >
      <Stack gap="xs" style={styles.textBlock}>
        <AppText variant="body" weight="600">
          {title}
        </AppText>
        {subtitle ? (
          <AppText color="secondary" variant="bodySmall">
            {subtitle}
          </AppText>
        ) : null}
      </Stack>
      {badge ? <AppBadge label={badge} variant={badgeVariant} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 56,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  textBlock: {
    flex: 1,
    minWidth: 0,
  },
  pressed: {
    opacity: opacity.pressed,
  },
  disabled: {
    opacity: opacity.disabled,
  },
});
