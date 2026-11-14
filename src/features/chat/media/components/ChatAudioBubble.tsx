import { memo, useMemo, useRef, useState } from 'react';
import {
  type AccessibilityActionEvent,
  type LayoutChangeEvent,
  PanResponder,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { AppText, Icon } from '../../../../components';
import { useTranslation } from '../../../../i18n';
import { colors, radius, spacing, useBrand } from '../../../../theme';
import { getIsRTL, isolateLtr } from '../../../../utils/rtl';
import type { ChatMessage } from '../../types';
import { useAudioClip } from '../hooks/useAudioClip';
import { progressFraction, seekPosition } from '../logic/playback';
import { formatClock } from '../logic/recorder';
import { resampleWaveform } from '../logic/waveform';

const BAR_WIDTH = 3;
const BAR_GAP = 2;
const TRACK_HEIGHT = 32;

function Waveform({
  values,
  fraction,
  onSeekFraction,
  label,
  valueText,
  onStep,
}: {
  values: number[] | null;
  fraction: number;
  onSeekFraction: (touchX: number, width: number) => void;
  label: string;
  valueText: string;
  onStep: (direction: 1 | -1) => void;
}) {
  const brand = useBrand();
  const [width, setWidth] = useState(0);
  const widthRef = useRef(0);
  const seekRef = useRef(onSeekFraction);

  seekRef.current = onSeekFraction;

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderRelease: (event) =>
          seekRef.current(event.nativeEvent.locationX, widthRef.current),
      }),
    [],
  );

  const handleLayout = (event: LayoutChangeEvent) => {
    widthRef.current = event.nativeEvent.layout.width;
    setWidth(widthRef.current);
  };

  const bars = useMemo(
    () => resampleWaveform(values, Math.max(8, Math.floor(width / (BAR_WIDTH + BAR_GAP)))),
    [values, width],
  );
  const playedBars = Math.round(bars.length * fraction);

  return (
    <View
      accessibilityActions={[
        { name: 'increment', label: '+5' },
        { name: 'decrement', label: '-5' },
      ]}
      accessibilityLabel={label}
      accessibilityRole="adjustable"
      accessibilityValue={{ text: valueText }}
      accessible
      onAccessibilityAction={(event: AccessibilityActionEvent) =>
        onStep(event.nativeEvent.actionName === 'increment' ? 1 : -1)
      }
      onLayout={handleLayout}
      style={styles.track}
      {...responder.panHandlers}
    >
      <View pointerEvents="none" style={styles.bars}>
        {bars.map((value, index) => (
          <View
            key={index}
            style={[
              styles.bar,
              {
                height: Math.max(3, Math.round((value / 255) * TRACK_HEIGHT)),
                backgroundColor: index < playedBars ? brand.primary : colors.gray[300],
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

/**
 * Voice message / uploaded audio file: play-pause, waveform you can tap to seek, elapsed / total, 1x-1.5x-2x speed,
 * loading and error states. Playback streams the protected URL; nothing is downloaded to the phone's storage.
 */
export const ChatAudioBubble = memo(function ChatAudioBubble({
  message,
}: {
  message: ChatMessage;
}) {
  const { t } = useTranslation();
  const brand = useBrand();
  const meta = message.attachment_meta;
  const isVoice = message.message_type === 'voice';
  const knownSec = (meta?.duration_ms ?? 0) / 1000;
  const groupId = message.group;
  const { state, toggle, seek, cycleSpeed, retry } = useAudioClip({
    id: `msg-${message.id}`,
    groupId: groupId ?? 0,
    messageId: message.id,
    knownDurationSec: knownSec,
  });
  const total = state.durationSec > 0 ? state.durationSec : knownSec;
  const fraction = progressFraction(state.positionSec, total);
  const playing = state.phase === 'playing';
  const clock =
    state.phase === 'idle' || total === 0
      ? formatClock(total * 1000)
      : `${formatClock(state.positionSec * 1000)} / ${formatClock(total * 1000)}`;

  return (
    <View style={styles.root}>
      {!isVoice && meta?.name ? (
        <View style={styles.nameRow}>
          <Icon color={brand.primary} name="music" size={16} />
          <AppText
            color="brand"
            numberOfLines={1}
            style={styles.name}
            variant="caption"
            weight="700"
          >
            {isolateLtr(meta.name)}
          </AppText>
        </View>
      ) : null}
      <View style={styles.row}>
        <Pressable
          accessibilityLabel={playing ? t.chat.media.pause : t.chat.media.play}
          accessibilityRole="button"
          accessibilityState={{ busy: state.phase === 'loading' }}
          disabled={groupId === null}
          onPress={state.phase === 'error' ? retry : toggle}
          style={[styles.play, { backgroundColor: brand.primary }]}
        >
          {state.phase === 'loading' ? (
            <View style={styles.spinner}>
              <AppText color="inverse" variant="caption">
                …
              </AppText>
            </View>
          ) : (
            <Icon color={brand.onPrimary} name={playing ? 'pause' : 'play'} size={20} />
          )}
        </Pressable>
        <View style={styles.main}>
          <Waveform
            fraction={fraction}
            label={t.chat.media.seekLabel}
            onSeekFraction={(touchX, width) => seek(seekPosition(touchX, width, total, getIsRTL()))}
            onStep={(direction) =>
              seek(Math.max(0, Math.min(total, state.positionSec + 5 * direction)))
            }
            valueText={t.chat.media.elapsedOf(
              formatClock(state.positionSec * 1000),
              formatClock(total * 1000),
            )}
            values={meta?.waveform ?? null}
          />
          <View style={styles.footer}>
            <AppText color="muted" variant="caption">
              {isolateLtr(clock)}
            </AppText>
            <Pressable
              accessibilityLabel={t.chat.media.speed(`${state.speed}x`)}
              accessibilityRole="button"
              hitSlop={8}
              onPress={cycleSpeed}
              style={[styles.speed, { borderColor: brand.primary }]}
            >
              <AppText color="brand" variant="caption" weight="700">
                {isolateLtr(`${state.speed}x`)}
              </AppText>
            </Pressable>
          </View>
        </View>
      </View>
      {state.phase === 'error' ? (
        <AppText accessibilityLiveRegion="polite" color="error" variant="caption">
          {t.chat.media.playbackError}
        </AppText>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  root: { minWidth: 230, gap: spacing.xs },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  name: { flexShrink: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  play: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: { alignItems: 'center', justifyContent: 'center' },
  main: { flex: 1, gap: 2 },
  track: { height: 44, justifyContent: 'center' },
  bars: { flexDirection: 'row', alignItems: 'center', gap: BAR_GAP, height: TRACK_HEIGHT },
  bar: { width: BAR_WIDTH, borderRadius: radius.full },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  speed: {
    minWidth: 36,
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
    paddingVertical: 1,
    borderRadius: radius.full,
    borderWidth: 1,
  },
});
