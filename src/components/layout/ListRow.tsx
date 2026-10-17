import { memo } from 'react';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, opacity, spacing } from '../../theme';
import type { StatusVariant } from '../../types/common';
import { getIsRTL } from '../../utils/rtl';
import { AppBadge, AppText } from '../common';
import type { IconName } from '../icons';
import { Icon } from '../icons';
import { IconTile } from '../media/IconTile';
import type { ArtworkTone } from '../media/artworkCatalog';

type ListRowProps = {
  title: string;
  subtitle?: string;
  icon?: IconName;
  tone?: ArtworkTone;
  /** Short text shown at the end of the row (e.g. current value or status). */
  value?: string;
  valueVariant?: StatusVariant;
  /** Custom end content (switches, selectors...). Replaces the chevron. */
  trailing?: ReactNode;
  disabled?: boolean;
  onPress?: () => void;
};

/**
 * Settings-style row: optional icon tile, title + description, value badge and a chevron
 * (mirrored for RTL) when it is pressable. 56dp minimum height, ripple feedback.
 */
function ListRowComponent({
  title,
  subtitle,
  icon,
  tone = 'brand',
  value,
  valueVariant = 'neutral',
  trailing,
  disabled = false,
  onPress,
}: ListRowProps) {
  const pressable = Boolean(onPress) && !disabled;
  const content = (
    <>
      {icon ? <IconTile icon={icon} size="sm" tone={tone} /> : null}
      <View style={styles.text}>
        <AppText variant="body" weight="600">
          {title}
        </AppText>
        {subtitle ? (
          <AppText color="secondary" variant="bodySmall">
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {value ? <AppBadge label={value} variant={valueVariant} /> : null}
      {trailing}
      {pressable && !trailing ? (
        <Icon
          color={colors.text.muted}
          name={getIsRTL() ? 'chevronLeft' : 'chevronRight'}
          size={18}
        />
      ) : null}
    </>
  );

  if (!onPress) {
    return <View style={[styles.row, disabled ? styles.disabled : null]}>{content}</View>;
  }

  return (
    <Pressable
      accessibilityLabel={subtitle ? `${title}. ${subtitle}` : title}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      android_ripple={{ color: colors.ripple, foreground: true }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        pressed && pressable ? styles.pressed : null,
        disabled ? styles.disabled : null,
      ]}
    >
      {content}
    </Pressable>
  );
}

export const ListRow = memo(ListRowComponent);

const styles = StyleSheet.create({
  row: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  text: {
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
