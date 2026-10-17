import { memo } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';

import { colors, useBrand } from '../../theme';
import { isDarkScheme } from '../../theme/colorScheme';
import type { IconName } from '../icons';
import { Icon } from '../icons';
import type { ArtworkTone } from './artworkCatalog';

type IconTileSize = 'sm' | 'md' | 'lg';

type IconTileProps = {
  icon: IconName;
  tone?: ArtworkTone;
  size?: IconTileSize;
  /** Read by screen readers; the tile is decorative when omitted. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

const tileSize: Record<IconTileSize, { box: number; icon: number; radius: number }> = {
  sm: { box: 40, icon: 20, radius: 12 },
  md: { box: 48, icon: 24, radius: 14 },
  lg: { box: 64, icon: 30, radius: 20 },
};

/** Rounded square with a tinted background and an icon: list-row leading visual. */
export const IconTile = memo(function IconTile({
  icon,
  tone = 'brand',
  size = 'md',
  accessibilityLabel,
  style,
}: IconTileProps) {
  const brand = useBrand();
  const dims = tileSize[size];
  let main: string = brand.primary;
  let soft: string = brand.primarySoft;
  if (tone === 'success') {
    main = colors.semantic.success;
    soft = colors.semantic.successSoft;
  } else if (tone === 'warning') {
    main = isDarkScheme ? colors.semantic.warning : '#B54708';
    soft = colors.semantic.warningSoft;
  } else if (tone === 'error') {
    main = colors.semantic.error;
    soft = colors.semantic.errorSoft;
  } else if (tone === 'info') {
    main = colors.semantic.info;
    soft = colors.semantic.infoSoft;
  } else if (tone === 'neutral') {
    main = colors.text.secondary;
    soft = colors.gray[100];
  }

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessible={accessibilityLabel ? true : undefined}
      importantForAccessibility={accessibilityLabel ? 'yes' : 'no-hide-descendants'}
      style={[
        styles.base,
        { width: dims.box, height: dims.box, borderRadius: dims.radius, backgroundColor: soft },
        style,
      ]}
    >
      <Icon color={main} name={icon} size={dims.icon} />
    </View>
  );
});

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
