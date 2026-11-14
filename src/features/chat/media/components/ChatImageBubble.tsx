import { memo } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { AppText, Icon, Skeleton } from '../../../../components';
import { useTranslation } from '../../../../i18n';
import { colors, radius, spacing } from '../../../../theme';
import type { ChatMessage } from '../../types';
import { useThumbnail } from '../hooks/useThumbnail';

const WIDTH = 224;
const MIN_HEIGHT = 120;
const MAX_HEIGHT = 300;

function heightFor(message: ChatMessage): number {
  const width = message.attachment_meta?.width ?? 0;
  const height = message.attachment_meta?.height ?? 0;

  if (width <= 0 || height <= 0) {
    return 180;
  }

  return Math.round(Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, (WIDTH * height) / width)));
}

/**
 * A picture in the chat: the small WebP thumbnail (from the encrypted cache when possible), sized from the server's width and
 * height so the list never jumps while pictures load. Tap opens the secure viewer; there is no long-press save of any kind.
 */
export const ChatImageBubble = memo(function ChatImageBubble({
  message,
  onOpen,
}: {
  message: ChatMessage;
  onOpen: (message: ChatMessage) => void;
}) {
  const { t } = useTranslation();
  const { state, retry } = useThumbnail(message.group, message.id);
  const frame = { width: WIDTH, height: heightFor(message) };

  if (state.status === 'error') {
    return (
      <View style={[frame, styles.frame, styles.center]}>
        <Icon color={colors.text.muted} name="image" size={30} />
        <AppText align="center" color="muted" variant="caption">
          {t.chat.media.openErrors[state.failure]}
        </AppText>
        <Pressable
          accessibilityLabel={t.common.retry}
          accessibilityRole="button"
          hitSlop={8}
          onPress={retry}
          style={styles.retry}
        >
          <Icon color={colors.brand.primary} name="refresh" size={18} />
          <AppText color="brand" variant="label" weight="700">
            {t.common.retry}
          </AppText>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => onOpen(message)}>
          <AppText color="muted" variant="caption">
            {t.chat.attachment.tapToView}
          </AppText>
        </Pressable>
      </View>
    );
  }

  return (
    <Pressable
      accessibilityHint={t.chat.attachment.tapToView}
      accessibilityLabel={t.chat.attachment.image}
      accessibilityRole="imagebutton"
      onPress={() => onOpen(message)}
      style={[frame, styles.frame]}
    >
      {state.status === 'ready' ? (
        <Image
          accessibilityIgnoresInvertColors
          fadeDuration={120}
          resizeMode="cover"
          source={{ uri: state.uri }}
          style={frame}
        />
      ) : (
        <Skeleton borderRadius={radius.lg} height={frame.height} width={frame.width} />
      )}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  frame: {
    overflow: 'hidden',
    borderRadius: radius.lg,
    backgroundColor: colors.background.muted,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    padding: spacing.md,
  },
  retry: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
});
