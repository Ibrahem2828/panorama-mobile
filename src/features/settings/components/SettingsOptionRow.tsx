import { Pressable, StyleSheet } from 'react-native';

import { AppBadge, AppText, Stack } from '../../../components';
import { opacity, spacing } from '../../../theme';
import type { StatusVariant } from '../../../types/common';

type SettingsOptionRowProps = {
  title: string;
  description?: string;
  value?: string;
  badgeVariant?: StatusVariant;
  disabled?: boolean;
  onPress?: () => void;
};

export function SettingsOptionRow({
  title,
  description,
  value,
  badgeVariant = 'neutral',
  disabled = false,
  onPress,
}: SettingsOptionRowProps) {
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
        {description ? (
          <AppText color="secondary" variant="bodySmall">
            {description}
          </AppText>
        ) : null}
      </Stack>
      {value ? <AppBadge label={value} variant={badgeVariant} /> : null}
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
