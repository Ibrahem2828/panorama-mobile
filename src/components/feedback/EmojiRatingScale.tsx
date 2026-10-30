import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  I18nManager,
  PanResponder,
  StyleSheet,
  View,
  type AccessibilityActionEvent,
  type LayoutChangeEvent,
} from 'react-native';

import { useTranslation } from '../../i18n';
import { colors, useBrand } from '../../theme';
import { AppText } from '../common';
import { useReduceMotion } from '../motion';
import { EmojiFace } from './EmojiFace';
import {
  RATING_LEVELS,
  RATING_VALUES,
  clampRating,
  ratingToX,
  ratingWord,
  stepRating,
  xToRating,
} from './emojiRatingLogic';

export type EmojiRatingSize = 'sm' | 'md' | 'lg';

const FACE_SIZE: Record<EmojiRatingSize, number> = { sm: 28, md: 34, lg: 42 };
const MIN_TOUCH = 44;
const RING_PAD = 5;

type ScaleProps = {
  /** Current rating 1..5, or null when nothing is chosen yet. */
  value: number | null;
  onChange: (value: number) => void;
  disabled?: boolean;
  size?: EmojiRatingSize;
  /** Hide the live word under the track. */
  hideLabel?: boolean;
};

/**
 * Five-step smiley scale (very sad -> wonderful). Tap a face or press and drag along the track;
 * the thumb ring snaps to the nearest face. Direction follows reading order (value 1 at the start,
 * so on the right in RTL) and all geometry is physical, see `emojiRatingLogic`.
 * Exposed to screen readers as one adjustable control (swipe up/down changes the value); the
 * individual faces are hidden from the accessibility tree so they do not fight the slider.
 */
export function EmojiRatingScale({
  value,
  onChange,
  disabled = false,
  size = 'md',
  hideLabel = false,
}: ScaleProps) {
  const { t } = useTranslation();
  const brand = useBrand();
  const reduceMotion = useReduceMotion();
  const isRTL = I18nManager.isRTL;
  const faceSize = FACE_SIZE[size];
  const thumbSize = faceSize + RING_PAD * 2;
  const height = Math.max(MIN_TOUCH, thumbSize + 6);

  const [width, setWidth] = useState(0);
  const slot = width / RATING_LEVELS;

  const thumbX = useRef(new Animated.Value(0)).current;
  const pop = useRef(new Animated.Value(1)).current;
  const placed = useRef(false);

  // Latest props for the (created-once) PanResponder.
  const live = useRef({ value, onChange, disabled, width, isRTL });
  live.current = { value, onChange, disabled, width, isRTL };
  const startX = useRef(0);

  const words = t.feedback.ratingScale.words;
  const selected = value === null ? null : clampRating(value);

  // Move the thumb with a spring (instant on first layout and under reduce-motion).
  useEffect(() => {
    if (selected === null || width <= 0) return;
    const target = ratingToX(selected, width, isRTL) - thumbSize / 2;
    if (!placed.current || reduceMotion) {
      thumbX.setValue(target);
      placed.current = true;
      return;
    }
    Animated.spring(thumbX, {
      toValue: target,
      speed: 28,
      bounciness: 6,
      useNativeDriver: true,
    }).start();
    pop.setValue(0.82);
    Animated.spring(pop, { toValue: 1, speed: 24, bounciness: 12, useNativeDriver: true }).start();
  }, [selected, width, isRTL, thumbSize, reduceMotion, thumbX, pop]);

  const pick = useCallback((x: number) => {
    const s = live.current;
    if (s.disabled || s.width <= 0) return;
    const next = xToRating(x, s.width, s.isRTL);
    if (next !== s.value) s.onChange(next);
  }, []);

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !live.current.disabled,
        onMoveShouldSetPanResponder: () => !live.current.disabled,
        // Keep the drag even when a parent ScrollView would like to take over.
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (event) => {
          startX.current = event.nativeEvent.locationX;
          pick(startX.current);
        },
        onPanResponderMove: (_event, gesture) => pick(startX.current + gesture.dx),
      }),
    [pick],
  );

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    setWidth(event.nativeEvent.layout.width);
  }, []);

  const onAccessibilityAction = useCallback(
    (event: AccessibilityActionEvent) => {
      if (disabled) return;
      if (event.nativeEvent.actionName === 'increment') onChange(stepRating(value, 1));
      if (event.nativeEvent.actionName === 'decrement') onChange(stepRating(value, -1));
    },
    [disabled, onChange, value],
  );

  const valueText =
    selected === null
      ? t.feedback.ratingScale.placeholder
      : t.feedback.ratingScale.valueText(ratingWord(selected, words), selected);

  return (
    <View style={styles.root}>
      <View
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        accessibilityHint={t.feedback.ratingScale.hint}
        accessibilityLabel={t.feedback.ratingLabel}
        accessibilityRole="adjustable"
        accessibilityState={{ disabled }}
        accessibilityValue={{
          min: 1,
          max: RATING_LEVELS,
          now: selected ?? undefined,
          text: valueText,
        }}
        accessible
        onAccessibilityAction={onAccessibilityAction}
        onLayout={onLayout}
        style={[styles.track, { height }, disabled ? styles.disabled : null]}
        {...responder.panHandlers}
      >
        {width > 0 ? (
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            {/* Track line through the five stops. */}
            <View style={[styles.line, { left: slot / 2, right: slot / 2, top: height / 2 - 2 }]} />
            {selected !== null ? (
              <Animated.View
                style={[
                  styles.thumb,
                  {
                    width: thumbSize,
                    height: thumbSize,
                    borderRadius: thumbSize / 2,
                    top: (height - thumbSize) / 2,
                    borderColor: brand.primary,
                    transform: [{ translateX: thumbX }, { scale: pop }],
                  },
                ]}
              />
            ) : null}
            {RATING_VALUES.map((step) => {
              const isSelected = selected === step;
              return (
                <View
                  accessibilityLabel={t.feedback.ratingOf(step)}
                  importantForAccessibility="no"
                  key={step}
                  style={[
                    styles.slot,
                    {
                      width: slot,
                      left: ratingToX(step, width, isRTL) - slot / 2,
                      height,
                      opacity: selected === null || isSelected ? 1 : 0.45,
                      transform: [{ scale: isSelected ? 1.12 : 0.86 }],
                    },
                  ]}
                >
                  <EmojiFace size={faceSize} value={step} />
                </View>
              );
            })}
          </View>
        ) : null}
      </View>
      {hideLabel ? null : (
        <AppText align="center" color={selected === null ? 'secondary' : 'primary'} variant="label">
          {selected === null ? t.feedback.ratingScale.placeholder : ratingWord(selected, words)}
        </AppText>
      )}
    </View>
  );
}

type DisplayProps = {
  value: number;
  /** Extra text after the word, e.g. "4 من 5". */
  scoreText?: string;
  size?: 'xs' | 'sm';
};

/** Compact read-only rating: small face + word (+ optional score text). */
export function EmojiRatingDisplay({ value, scoreText, size = 'sm' }: DisplayProps) {
  const { t } = useTranslation();
  const level = clampRating(value);
  const word = ratingWord(level, t.feedback.ratingScale.words);
  const label = t.feedback.ratingScale.valueText(word, level);
  const face = size === 'xs' ? 18 : 24;

  return (
    <View accessibilityLabel={label} accessible style={styles.display}>
      <EmojiFace size={face} value={level} />
      <AppText color="secondary" variant="caption">
        {scoreText ? `${word} · ${scoreText}` : word}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignSelf: 'stretch', gap: 6 },
  track: { alignSelf: 'stretch', justifyContent: 'center' },
  disabled: { opacity: 0.5 },
  line: {
    position: 'absolute',
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border.default,
  },
  thumb: { position: 'absolute', left: 0, borderWidth: 2.5, backgroundColor: 'transparent' },
  slot: { position: 'absolute', top: 0, alignItems: 'center', justifyContent: 'center' },
  display: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
