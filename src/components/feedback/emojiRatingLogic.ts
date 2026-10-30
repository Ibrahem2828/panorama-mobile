/**
 * Pure logic for the smiley rating scale (no React / native imports, unit-testable in node).
 *
 * Coordinates are PHYSICAL (x grows to the right, like React Native's `left` / `locationX`),
 * so the only place direction matters is the value <-> position mapping below.
 *
 * Direction decision: the scale follows reading order. Value 1 (very sad) sits at the START of
 * the track and value 5 (wonderful) at the END. In LTR that is left -> right; in RTL (Arabic) it
 * is right -> left, so «حزين جدًا» is on the right and «رائع» on the left.
 */
export const RATING_MIN = 1;
export const RATING_MAX = 5;
export const RATING_LEVELS = 5;

export type RatingLevel = 1 | 2 | 3 | 4 | 5;
export const RATING_VALUES: readonly RatingLevel[] = [1, 2, 3, 4, 5];

/** Colour ramp red -> orange -> yellow -> light green -> green (same in light and dark mode). */
export const RATING_COLORS: Record<RatingLevel, string> = {
  1: '#E5484D',
  2: '#F08A24',
  3: '#F5C518',
  4: '#8BCF4A',
  5: '#2FB36A',
};

/** Clamp to an integer in 1..5 (non-finite input falls back to the minimum). */
export function clampRating(value: number): RatingLevel {
  if (!Number.isFinite(value)) return RATING_MIN;
  return Math.min(RATING_MAX, Math.max(RATING_MIN, Math.round(value))) as RatingLevel;
}

/** Zero-based slot (0 = leftmost) a rating occupies on the physical track. */
export function ratingToSlot(value: number, isRTL: boolean): number {
  const index = clampRating(value) - 1;
  return isRTL ? RATING_LEVELS - 1 - index : index;
}

/** Physical centre of a rating's stop as a 0..1 fraction of the track width. */
export function ratingToFraction(value: number, isRTL: boolean): number {
  return (ratingToSlot(value, isRTL) + 0.5) / RATING_LEVELS;
}

/** Nearest rating for a physical 0..1 fraction of the track width (out-of-range is clamped). */
export function fractionToRating(fraction: number, isRTL: boolean): RatingLevel {
  const safe = Number.isFinite(fraction) ? Math.min(1, Math.max(0, fraction)) : 0;
  const slot = Math.min(RATING_LEVELS - 1, Math.floor(safe * RATING_LEVELS));
  const index = isRTL ? RATING_LEVELS - 1 - slot : slot;
  return (index + 1) as RatingLevel;
}

/** Nearest rating for a physical x (dp) on a track of `width` dp. */
export function xToRating(x: number, width: number, isRTL: boolean): RatingLevel {
  if (!(width > 0)) return fractionToRating(0, isRTL);
  return fractionToRating(x / width, isRTL);
}

/** Physical centre x (dp) of a rating's stop on a track of `width` dp. */
export function ratingToX(value: number, width: number, isRTL: boolean): number {
  return ratingToFraction(value, isRTL) * width;
}

/**
 * Step used by accessibility increment/decrement (+1 = happier). From "no answer" either
 * direction lands on the neutral middle face so the user starts from a sensible place.
 */
export function stepRating(value: number | null, delta: 1 | -1): RatingLevel {
  if (value === null) return 3;
  return clampRating(value + delta);
}

/** Word for a rating; `words` is the 5-item list from the i18n catalog (index 0 = rating 1). */
export function ratingWord(value: number, words: readonly string[]): string {
  return words[clampRating(value) - 1] ?? '';
}
