import { useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';

import { AppBadge, AppCard, AppText, Stack } from '../../../components';
import { colors, opacity, spacing } from '../../../theme';
import { createPressScaleAnim } from '../../../utils/motion';
import type { HomeQuickAction } from '../types';

type HomeQuickActionCardProps = {
  action: HomeQuickAction;
  marker: string;
  onPress?: () => void;
};

export function HomeQuickActionCard({ action, marker, onPress }: HomeQuickActionCardProps) {
  const disabled = action.disabled || !onPress;
  const { scale, onPressIn, onPressOut } = useRef(createPressScaleAnim()).current;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      onPressIn={disabled ? undefined : onPressIn}
      onPressOut={disabled ? undefined : onPressOut}
      style={() => [styles.pressable, disabled ? styles.disabled : null]}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <AppCard padding="md" style={styles.card} variant="default">
          <Stack gap="md">
            <View style={styles.header}>
              <View style={styles.marker}>
                <AppText align="center" color="brand" variant="button">
                  {marker}
                </AppText>
              </View>
              {action.badge ? <AppBadge label={action.badge} variant="warning" /> : null}
            </View>

            <Stack gap="xs">
              <AppText variant="title">{action.title}</AppText>
              <AppText color="secondary" variant="bodySmall">
                {action.description}
              </AppText>
            </Stack>
          </Stack>
        </AppCard>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    width: '48%',
    minWidth: 152,
    flexGrow: 1,
  },
  card: {
    minHeight: 148,
  },
  disabled: {
    opacity: opacity.disabled,
  },
  pressed: {
    opacity: opacity.pressed,
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  marker: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: colors.brand.primarySoft,
  },
});
