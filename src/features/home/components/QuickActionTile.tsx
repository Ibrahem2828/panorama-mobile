import { memo, useCallback } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Icon, type IconName } from '../../../components';
import { colors, useBrand } from '../../../theme';

type QuickActionTileProps<K extends string> = {
  actionKey: K;
  label: string;
  icon: IconName;
  badge?: string;
  onPress?: (key: K) => void;
};

function QuickActionTileComponent<K extends string>({
  actionKey,
  label,
  icon,
  badge,
  onPress,
}: QuickActionTileProps<K>) {
  const brand = useBrand();
  const handlePress = useCallback(() => onPress?.(actionKey), [actionKey, onPress]);

  return (
    <Pressable
      accessibilityLabel={badge ? `${label} (${badge})` : label}
      accessibilityRole="button"
      android_ripple={{ color: brand.primarySoft, borderless: true, radius: 40 }}
      onPress={handlePress}
      style={({ pressed }) => [styles.tile, pressed ? styles.pressed : null]}
    >
      <View style={[styles.iconBox, { backgroundColor: brand.primarySoft }]}>
        <Icon color={brand.primary} name={icon} size={24} />
        {badge ? (
          <View style={[styles.badge, { backgroundColor: brand.accent }]}>
            <AppText style={styles.badgeText} variant="caption" weight="700">
              {badge}
            </AppText>
          </View>
        ) : null}
      </View>
      <AppText align="center" numberOfLines={2} style={styles.label} variant="caption" weight="600">
        {label}
      </AppText>
    </Pressable>
  );
}

export const QuickActionTile = memo(QuickActionTileComponent) as typeof QuickActionTileComponent;

const styles = StyleSheet.create({
  tile: { width: '25%', alignItems: 'center', gap: 8, paddingVertical: 8, minHeight: 96 },
  pressed: { opacity: 0.7 },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { minHeight: 32 },
  badge: {
    position: 'absolute',
    top: -4,
    end: -4,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: colors.text.inverse, fontSize: 11, lineHeight: 14 },
});
