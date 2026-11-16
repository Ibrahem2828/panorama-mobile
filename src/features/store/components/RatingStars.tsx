import { StyleSheet, View } from 'react-native';

import { Icon } from '../../../components';
import { colors } from '../../../theme';
import { starFills } from '../services';

/** Gold used for rating stars in both themes (a rating is not a brand colour). */
export const STAR_COLOR = '#F5A524';

type RatingStarsProps = {
  value: string | number | null | undefined;
  size?: number;
};

/** Five stars for an average (decorative: the number next to it carries the meaning). */
export function RatingStars({ value, size = 14 }: RatingStarsProps) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={styles.row}
    >
      {starFills(value).map((fill, index) => (
        <View key={index} style={{ width: size, height: size }}>
          <Icon color={colors.border.strong} name="star" size={size} strokeWidth={1.6} />
          {fill !== 'empty' ? (
            <View
              style={[
                styles.overlay,
                fill === 'half' ? { width: size / 2, overflow: 'hidden' } : { end: 0 },
              ]}
            >
              <Icon color={STAR_COLOR} filled name="star" size={size} strokeWidth={1.6} />
            </View>
          ) : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 2 },
  overlay: { position: 'absolute', top: 0, bottom: 0, start: 0 },
});
