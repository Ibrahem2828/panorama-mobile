import type { ImageSourcePropType, StyleProp, ViewStyle } from 'react-native';

import { Illustration } from './Illustration';

type StateIllustrationProps = {
  source: ImageSourcePropType;
  accessibilityLabel: string;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function StateIllustration({
  source,
  accessibilityLabel,
  compact = false,
  style,
}: StateIllustrationProps) {
  return (
    <Illustration
      accessibilityLabel={accessibilityLabel}
      size={compact ? 'lg' : 'xl'}
      source={source}
      style={style}
    />
  );
}
