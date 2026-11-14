import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { AppButton, AppIconButton, AppText, Icon } from '../../../../components';
import { useTranslation } from '../../../../i18n';
import { colors, radius, spacing } from '../../../../theme';
import { isolateLtr } from '../../../../utils/rtl';
import { VOICE_MAX_MS } from '../logic/limits';
import { formatClock, isNearLimit, remainingMs, type RecorderState } from '../logic/recorder';

const METER_BARS = 26;

/** The composer row while recording: cancel, pulsing dot + timer, live level meter, remaining time, send. */
export function VoiceRecorderBar({
  state,
  onCancel,
  onSend,
  onDiscard,
}: {
  state: RecorderState;
  onCancel: () => void;
  onSend: () => void;
  onDiscard: () => void;
}) {
  const { t } = useTranslation();
  const [levels, setLevels] = useState<number[]>(() => Array.from({ length: METER_BARS }, () => 0));
  const pulse = useRef(new Animated.Value(1)).current;
  const recording = state.phase === 'recording';
  const review = state.phase === 'review';
  const near = isNearLimit(state.elapsedMs);
  const remaining = remainingMs(state.elapsedMs);

  useEffect(() => {
    if (!recording) {
      return;
    }

    setLevels((current) => [...current.slice(1), state.level]);
  }, [recording, state.level, state.elapsedMs]);

  useEffect(() => {
    if (!recording) {
      return undefined;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 0.25,
          duration: 600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );

    loop.start();

    return () => loop.stop();
  }, [pulse, recording]);

  const timer = formatClock(state.elapsedMs);

  return (
    <View style={styles.wrap}>
      {review ? (
        <View
          accessibilityLiveRegion="assertive"
          accessibilityRole="alert"
          style={styles.limitBanner}
        >
          <Icon color={colors.semantic.warning} name="clock" size={18} />
          <AppText style={styles.flex} variant="bodySmall">
            {t.chat.media.limitReached}
          </AppText>
        </View>
      ) : null}

      <View style={styles.row}>
        <AppIconButton
          accessibilityLabel={review ? t.chat.media.discardVoice : t.chat.media.cancelRecording}
          icon={<Icon color={colors.semantic.error} name="trash" />}
          onPress={review ? onDiscard : onCancel}
        />

        <View
          accessibilityLabel={t.chat.media.recordingLabel(timer)}
          accessible
          style={styles.center}
        >
          {recording ? (
            <Animated.View style={[styles.dot, { opacity: pulse }]} />
          ) : (
            <View style={[styles.dot, styles.dotStill]} />
          )}
          <AppText variant="label" weight="700">
            {isolateLtr(timer)}
          </AppText>
          <View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={styles.meter}
          >
            {levels.map((level, index) => (
              <View
                key={index}
                style={[
                  styles.meterBar,
                  { height: 4 + Math.round(level * 24) },
                  near ? styles.meterBarWarn : null,
                ]}
              />
            ))}
          </View>
        </View>

        <AppIconButton
          accessibilityLabel={t.chat.media.sendVoice}
          disabled={state.phase === 'stopping' || (recording && state.elapsedMs < 500)}
          icon={<Icon color="#FFFFFF" name="send" size={20} />}
          onPress={onSend}
          shape="circle"
          variant="primary"
        />
      </View>

      {recording ? (
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              near ? styles.progressWarn : null,
              { width: `${Math.min(100, (state.elapsedMs / VOICE_MAX_MS) * 100)}%` },
            ]}
          />
        </View>
      ) : null}

      {recording && near ? (
        <AppText accessibilityLiveRegion="polite" color="error" variant="caption" weight="700">
          {t.chat.media.nearLimit(Math.ceil(remaining / 1000))} ·{' '}
          {t.chat.media.remaining(isolateLtr(formatClock(remaining)))}
        </AppText>
      ) : null}
    </View>
  );
}

/** Shown before the first microphone request (and again after a denial that can still be asked again). */
export function MicRationale({ onAllow, onCancel }: { onAllow: () => void; onCancel: () => void }) {
  const { t } = useTranslation();

  return (
    <View style={styles.rationale}>
      <View style={styles.rationaleHead}>
        <Icon color={colors.brand.primary} name="mic" size={22} />
        <AppText variant="label" weight="700">
          {t.chat.media.micRationaleTitle}
        </AppText>
      </View>
      <AppText color="secondary" variant="bodySmall">
        {t.chat.media.micRationale}
      </AppText>
      <View style={styles.rationaleActions}>
        <AppButton onPress={onCancel} size="sm" title={t.common.cancel} variant="ghost" />
        <AppButton onPress={onAllow} size="sm" title={t.chat.media.micAllow} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  wrap: { gap: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  center: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 44,
    paddingHorizontal: spacing.md,
    borderRadius: radius.xxl,
    backgroundColor: colors.background.muted,
  },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.semantic.error },
  dotStill: { backgroundColor: colors.text.muted },
  meter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 28,
  },
  meterBar: { width: 3, borderRadius: 2, backgroundColor: colors.brand.primary },
  meterBarWarn: { backgroundColor: colors.semantic.error },
  progressTrack: {
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.gray[200],
    overflow: 'hidden',
  },
  progressFill: { height: 3, backgroundColor: colors.brand.primary },
  progressWarn: { backgroundColor: colors.semantic.error },
  limitBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.semantic.warningSoft,
  },
  rationale: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.background.muted,
  },
  rationaleHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rationaleActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm },
});
