import type { StyleProp, ViewStyle } from 'react-native';
import { Image, StyleSheet, View } from 'react-native';

import { colors, layout, radius, useBrand } from '../../theme';
import { getInitials } from '../../utils/strings';
import { AppText } from './AppText';

type AvatarSize = keyof typeof layout.avatar;

type AppAvatarProps = {
  name: string;
  imageUri?: string;
  size?: AvatarSize;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

export function AppAvatar({
  name,
  imageUri,
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
      ) : (
        <AppText align="center" color="brand" variant="label" weight="700">
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
