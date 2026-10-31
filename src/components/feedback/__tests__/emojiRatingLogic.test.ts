import { ar } from '../../../i18n/locales/ar';
import { en } from '../../../i18n/locales/en';
import {
  RATING_COLORS,
  clampRating,
  fractionToRating,
  ratingToFraction,
  ratingToX,
  ratingWord,
  stepRating,
  xToRating,
} from '../emojiRatingLogic';

describe('emoji rating logic', () => {
  it('clamps and rounds to 1..5', () => {
    expect(clampRating(0)).toBe(1);
    expect(clampRating(-3)).toBe(1);
    expect(clampRating(9)).toBe(5);
    expect(clampRating(3.4)).toBe(3);
    expect(clampRating(3.6)).toBe(4);
    expect(clampRating(Number.NaN)).toBe(1);
  });

  it('maps values to stop centres LTR (sad at left, wonderful at right)', () => {
    expect([1, 2, 3, 4, 5].map((v) => ratingToFraction(v, false))).toEqual([
      0.1, 0.3, 0.5, 0.7, 0.9,
    ]);
    expect(ratingToX(1, 250, false)).toBeCloseTo(25);
    expect(ratingToX(5, 250, false)).toBeCloseTo(225);
  });

  it('mirrors the physical position under RTL (sad at the right/start)', () => {
    expect([1, 2, 3, 4, 5].map((v) => ratingToFraction(v, true))).toEqual([
      0.9, 0.7, 0.5, 0.3, 0.1,
    ]);
    expect(ratingToX(1, 250, true)).toBeCloseTo(225);
    expect(ratingToX(5, 250, true)).toBeCloseTo(25);
  });

  it('round-trips value -> x -> value in both directions', () => {
    for (const rtl of [false, true]) {
      for (const v of [1, 2, 3, 4, 5]) {
        expect(xToRating(ratingToX(v, 220, rtl), 220, rtl)).toBe(v);
      }
    }
  });

  it('snaps to the nearest face at slot boundaries', () => {
    expect(fractionToRating(0.19, false)).toBe(1);
    expect(fractionToRating(0.21, false)).toBe(2);
    expect(fractionToRating(0.79, false)).toBe(4);
    expect(fractionToRating(0.81, false)).toBe(5);
    expect(fractionToRating(0.19, true)).toBe(5);
    expect(fractionToRating(0.81, true)).toBe(1);
  });

  it('clamps drags outside the track', () => {
    expect(xToRating(-80, 200, false)).toBe(1);
    expect(xToRating(999, 200, false)).toBe(5);
    expect(xToRating(-80, 200, true)).toBe(5);
    expect(xToRating(999, 200, true)).toBe(1);
    expect(xToRating(10, 0, false)).toBe(1);
    expect(fractionToRating(1, false)).toBe(5);
    expect(fractionToRating(Number.NaN, false)).toBe(1);
  });

  it('steps for accessibility increment/decrement and clamps at the ends', () => {
    expect(stepRating(3, 1)).toBe(4);
    expect(stepRating(5, 1)).toBe(5);
    expect(stepRating(1, -1)).toBe(1);
    expect(stepRating(null, 1)).toBe(3);
    expect(stepRating(null, -1)).toBe(3);
  });

  it('maps ratings to words and colours', () => {
    expect([1, 2, 3, 4, 5].map((v) => ratingWord(v, ar.feedback.ratingScale.words))).toEqual([
      'حزين جدًا',
      'سيئ',
      'مقبول',
      'جيد',
      'رائع',
    ]);
    expect(ratingWord(9, en.feedback.ratingScale.words)).toBe('Wonderful');
    expect(new Set(Object.values(RATING_COLORS)).size).toBe(5);
  });

  it('builds the accessibility value text', () => {
    expect(ar.feedback.ratingScale.valueText('جيد', 4)).toBe('التقييم: جيد، 4 من 5');
    expect(en.feedback.ratingScale.valueText('Good', 4)).toBe('Rating: Good, 4 of 5');
    expect(en.feedback.ratingScale.words).toHaveLength(5);
    expect(ar.feedback.ratingScale.words).toHaveLength(5);
  });
});
