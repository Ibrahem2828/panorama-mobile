import type { ImageSourcePropType, StyleProp, ViewStyle } from 'react-native';
import { Image, StyleSheet, View } from 'react-native';

type IllustrationSize = 'sm' | 'md' | 'lg' | 'xl';

type IllustrationProps = {
  source: ImageSourcePropType;
  accessibilityLabel: string;
  size?: IllustrationSize;
  style?: StyleProp<ViewStyle>;
};

const sizeStyles: Record<IllustrationSize, ViewStyle> = {
  sm: {
    width: 48,
    height: 48,
  },
  md: {
    width: 72,
    height: 72,
  },
  lg: {
    width: 220,
    height: 180,
    maxWidth: '82%',
  },
  xl: {
    width: 300,
    height: 240,
    maxWidth: '90%',
  },
};

export function Illustration({
  source,
  accessibilityLabel,
  size = 'lg',
  style,
}: IllustrationProps) {
  return (
    <View style={[styles.container, sizeStyles[size], style]}>
      <Image
        accessibilityIgnoresInvertColors
        accessibilityLabel={accessibilityLabel}
        resizeMode="contain"
        source={source}
        style={styles.image}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
