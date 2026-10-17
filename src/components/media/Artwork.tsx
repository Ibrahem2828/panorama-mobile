import { memo } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';

import { colors, useBrand } from '../../theme';
import { Icon } from '../icons';
import type { ArtworkKey, ArtworkSpec, ArtworkTone } from './artworkCatalog';
import { artworks } from './artworkCatalog';

type ArtworkSize = 'sm' | 'md' | 'lg';

type ArtworkProps = {
  name: ArtworkKey;
  size?: ArtworkSize;
  /** Overrides the tone defined for the artwork. */
  tone?: ArtworkTone;
  style?: StyleProp<ViewStyle>;
};

const dimensions: Record<ArtworkSize, number> = { sm: 48, md: 88, lg: 136 };

function useTone(tone: ArtworkTone) {
  const brand = useBrand();
  switch (tone) {
    case 'success':
      return { main: colors.semantic.success, soft: colors.semantic.successSoft };
    case 'warning':
      return { main: colors.semantic.warning, soft: colors.semantic.warningSoft };
    case 'error':
      return { main: colors.semantic.error, soft: colors.semantic.errorSoft };
    case 'info':
      return { main: colors.semantic.info, soft: colors.semantic.infoSoft };
    case 'neutral':
      return { main: colors.text.secondary, soft: colors.gray[100] };
    default:
      return { main: brand.primary, soft: brand.primarySoft };
  }
}

/**
 * Soft blob + icon artwork. It replaces bitmap illustrations: it is crisp at any density,
 * costs no bundle weight and re-colours itself with the student's faculty theme.
 */
export const Artwork = memo(function Artwork({ name, size = 'lg', tone, style }: ArtworkProps) {
  const brand = useBrand();
  const spec: ArtworkSpec = artworks[name];
  const palette = useTone(tone ?? spec.tone ?? 'brand');
  const box = dimensions[size];
  const core = Math.round(box * 0.62);
  const dot = Math.max(8, Math.round(box * 0.14));

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.box, { width: box, height: box }, style]}
    >
      <View
        style={[
          styles.blob,
          { width: box, height: box, borderRadius: box / 2, backgroundColor: palette.soft },
        ]}
      />
      <View
        style={[
          styles.core,
          { width: core, height: core, borderRadius: core / 2 },
          size === 'sm' ? null : styles.coreShadow,
        ]}
      >
        <Icon color={palette.main} name={spec.icon} size={Math.round(core * 0.5)} />
      </View>
      {size === 'sm' ? null : (
        <>
          <View
            style={[
              styles.dot,
              {
                width: dot * 1.4,
                height: dot * 1.4,
                borderRadius: dot * 0.7,
                top: box * 0.06,
                end: box * 0.1,
                backgroundColor: brand.accent,
                opacity: 0.85,
              },
            ]}
          />
          <View
            style={[
              styles.dot,
              {
                width: dot,
                height: dot,
                borderRadius: dot / 2,
                bottom: box * 0.1,
                start: box * 0.04,
                backgroundColor: brand.secondary,
                opacity: 0.55,
              },
            ]}
          />
        </>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  box: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  blob: {
    position: 'absolute',
  },
  core: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.surface,
  },
  coreShadow: {
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  dot: {
    position: 'absolute',
  },
});
