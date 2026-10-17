import type { TextStyle } from 'react-native';

/** Noto Kufi Arabic (the same face as the web app), bundled as static weights so Android renders every weight. */
export const fontFiles = {
  'NotoKufiArabic-Regular': require('../assets/fonts/NotoKufiArabic-Regular.ttf'),
  'NotoKufiArabic-SemiBold': require('../assets/fonts/NotoKufiArabic-SemiBold.ttf'),
  'NotoKufiArabic-Bold': require('../assets/fonts/NotoKufiArabic-Bold.ttf'),
} as const;

type FontWeight = NonNullable<TextStyle['fontWeight']>;

/** Maps a numeric/keyword weight to the bundled family; custom fonts must not also receive `fontWeight`. */
export function fontFamilyForWeight(weight: FontWeight | undefined): string {
  const value =
    weight === 'bold' ? 700 : weight === 'normal' || weight === undefined ? 400 : Number(weight);
  if (value >= 700) return 'NotoKufiArabic-Bold';
  if (value >= 500) return 'NotoKufiArabic-SemiBold';
  return 'NotoKufiArabic-Regular';
}
