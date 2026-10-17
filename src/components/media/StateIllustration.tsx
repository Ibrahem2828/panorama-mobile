import type { ImageSourcePropType, StyleProp, ViewStyle } from 'react-native';

import { Artwork } from './Artwork';
import type { ArtworkKey } from './artworkCatalog';
import { Illustration } from './Illustration';

type StateIllustrationProps = {
  /** Icon artwork (preferred in the main app). */
  artwork?: ArtworkKey;
  /** Legacy bitmap source, kept for flows that still ship their own artwork. */
  source?: ImageSourcePropType;
  accessibilityLabel: string;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function StateIllustration({
  artwork,
  source,
  accessibilityLabel,
  compact = false,
  style,
}: StateIllustrationProps) {
  if (artwork) {
    return <Artwork name={artwork} size={compact ? 'md' : 'lg'} style={style} />;
  }
  if (!source) {
    return null;
  }
  return (
    <Illustration
      accessibilityLabel={accessibilityLabel}
      size={compact ? 'lg' : 'xl'}
      source={source}
      style={style}
    />
  );
}
