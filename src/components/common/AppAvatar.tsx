import type { StyleProp, ViewStyle } from 'react-native';
import { Image, StyleSheet, View } from 'react-native';

import { colors, layout, radius, useBrand } from '../../theme';
import { getInitials } from '../../utils/strings';
import type { IconName } from '../icons';
import { Icon } from '../icons';
import { AppText } from './AppText';

type AvatarSize = keyof typeof layout.avatar;

type AppAvatarProps = {
  name: string;
  imageUri?: string;
  /** Shown instead of initials (e.g. for groups, whose Arabic initial is just a stroke). */
  icon?: IconName;
  size?: AvatarSize;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

export function AppAvatar({
  name,
  imageUri,
  icon,
  size = 'md',
  accessibilityLabel,
  style,
}: AppAvatarProps) {
  const brand = useBrand();
  const dimension = layout.avatar[size];
  const containerStyle = {
    width: dimension,
    height: dimension,
    borderRadius: dimension / 2,
  };

  return (
    <View
      accessibilityLabel={accessibilityLabel ?? name}
      accessibilityRole="image"
      style={[styles.base, { backgroundColor: brand.primarySoft }, containerStyle, style]}
    >
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={[styles.image, containerStyle]} />
      ) : icon ? (
        <Icon color={brand.primary} name={icon} size={Math.round(dimension * 0.5)} />
      ) : (
        <AppText align="center" color="brand" variant={size === 'xl' ? 'h3' : 'label'} weight="700">
          {getInitials(name)}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: colors.brand.primarySoft,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radius.avatar,
  },
  image: {
    resizeMode: 'cover',
  },
});
