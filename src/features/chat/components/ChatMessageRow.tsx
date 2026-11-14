import { memo, useMemo, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { AppAvatar, AppText, Icon, Stack } from '../../../components';
import { colors, layout, radius, spacing, useBrand } from '../../../theme';
import { useTranslation } from '../../../i18n';
import { getChatSenderName } from '../logic/messages';
import {
  canReplyToMessage,
  isHorizontalSwipe,
  quotedFromMessage,
  quotedFromPending,
  shouldTriggerReply,
} from '../logic/reply';
import { getDayLabel } from '../logic/timeline';
import { isolateLtr } from '../../../utils/rtl';
import type { ChatListItem, ChatMessage, DeliveryState, PendingMessage } from '../types';
import { formatMegabytes, formatMessageClock, formatMessageDay } from './chatFormat';
import { ReplyQuote } from './ReplyQuote';

const AVATAR_SIZE = layout.avatar.sm;

/** Message bodies follow their own script direction so mixed Arabic/English text reads right. */
const BODY_STYLE = { writingDirection: 'auto' } as const;

type RowCallbacks = {
  onOpenAttachment: (message: ChatMessage) => void;
  onLongPressMessage: (message: ChatMessage) => void;
  /** Swipe-to-reply; absent when the member cannot post. */
  onReply?: (message: ChatMessage) => void;
  onJumpToReply: (messageId: number) => void;
  onRetry: (localId: string) => void;
  onDiscard: (localId: string) => void;
};

type ChatMessageRowProps = RowCallbacks & {
  item: ChatListItem;
  /** The message just jumped to from a quote: it is tinted for a moment. */
  highlighted: boolean;
};

const DaySeparator = memo(function DaySeparator({ date }: { date: string }) {
  const { t, locale } = useTranslation();
  const label = useMemo(
    () =>
      getDayLabel(date, new Date(), { today: t.chat.today, yesterday: t.chat.yesterday }, (value) =>
        formatMessageDay(value, locale),
      ),
    [date, locale, t.chat.today, t.chat.yesterday],
  );

  return (
    <View style={styles.centerRow}>
      <View style={styles.pill}>
        <AppText align="center" color="muted" variant="caption" weight="600">
          {label}
        </AppText>
      </View>
    </View>
  );
});

const SystemRow = memo(function SystemRow({ message }: { message: ChatMessage }) {
  const { t } = useTranslation();

  return (
    <View style={styles.centerRow}>
      <View style={styles.pill}>
        <AppText align="center" color="muted" style={BODY_STYLE} variant="caption">
          {message.content || t.chat.systemMessage}
        </AppText>
      </View>
    </View>
  );
});

function AttachmentTile({
  message,
  onOpen,
}: {
  message: ChatMessage;
  onOpen: (message: ChatMessage) => void;
}) {
  const { t } = useTranslation();
  const brand = useBrand();
  const label = message.message_type === 'image' ? t.chat.attachment.image : t.chat.attachment.file;
  const meta = message.attachment_meta;
  const size = meta?.size ? formatMegabytes(meta.size) : null;

  return (
    <Pressable
      accessibilityHint={t.chat.attachment.tapToView}
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={() => onOpen(message)}
      style={({ pressed }) => [styles.attachmentTile, pressed ? styles.pressed : null]}
    >
      <Icon
        color={brand.primary}
        name={message.message_type === 'image' ? 'image' : 'file'}
        size={26}
      />
      <View style={styles.attachmentText}>
        <AppText color="brand" numberOfLines={1} variant="label" weight="600">
          {message.message_type === 'file' && meta?.name ? isolateLtr(meta.name) : label}
        </AppText>
        <AppText color="muted" variant="caption">
          {size ? `${t.chat.attachment.sizeLabel(size)} · ` : ''}
          {t.chat.attachment.tapToView}
        </AppText>
      </View>
    </Pressable>
  );
}

/** One grey tick = sent, two grey = delivered to someone, two blue = read by someone. */
const DeliveryTicks = memo(function DeliveryTicks({ state }: { state: DeliveryState }) {
  const { t } = useTranslation();

  return (
    <View accessibilityLabel={t.chat.ticks[state]} accessible style={styles.ticks}>
      <Icon
        color={state === 'read' ? colors.semantic.info : colors.text.muted}
        name={state === 'sent' ? 'check' : 'checkAll'}
        size={16}
        strokeWidth={2.2}
      />
    </View>
  );
});

const ReactionChips = memo(function ReactionChips({ message }: { message: ChatMessage }) {
  const brand = useBrand();

  if (message.reactions.length === 0) {
    return null;
  }

  return (
    <View style={styles.reactions}>
      {message.reactions.map((reaction) => {
        const mine = reaction.emoji === message.my_reaction;

        return (
          <View
            key={reaction.emoji}
            style={[
              styles.reactionChip,
              mine ? { backgroundColor: brand.primarySoft, borderColor: brand.primary } : null,
            ]}
          >
            <AppText variant="caption">{reaction.emoji}</AppText>
            <AppText color={mine ? 'brand' : 'secondary'} variant="caption" weight="700">
              {reaction.count}
            </AppText>
          </View>
        );
      })}
    </View>
  );
});

/**
 * Swipe-to-reply: a deliberate horizontal drag (either direction, so it behaves the same in RTL and LTR) slides the bubble a
 * little and replies once it passes SWIPE_REPLY_DISTANCE; the bubble springs back. Vertical scrolling is left to the list.
 */
function useSwipeToReply(onTrigger: (() => void) | undefined) {
  const translateX = useRef(new Animated.Value(0)).current;
  const trigger = useRef(onTrigger);

  trigger.current = onTrigger;

  const handlers = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_event, gesture) =>
          trigger.current !== undefined && isHorizontalSwipe(gesture.dx, gesture.dy),
        onPanResponderMove: (_event, gesture) =>
          translateX.setValue(Math.max(-72, Math.min(72, gesture.dx))),
        onPanResponderRelease: (_event, gesture) => {
          if (shouldTriggerReply(gesture.dx)) trigger.current?.();
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
        },
        onPanResponderTerminate: () => {
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
        },
      }).panHandlers,
    [translateX],
  );

  return { handlers, translateX };
}

const MessageBubble = memo(function MessageBubble({
  message,
  own,
  delivery,
  groupStart,
  highlighted,
  onOpenAttachment,
  onLongPressMessage,
  onReply,
  onJumpToReply,
}: {
  message: ChatMessage;
  own: boolean;
  delivery: DeliveryState | null;
  groupStart: boolean;
  highlighted: boolean;
  onOpenAttachment: (message: ChatMessage) => void;
  onLongPressMessage: (message: ChatMessage) => void;
  onReply?: (message: ChatMessage) => void;
  onJumpToReply: (messageId: number) => void;
}) {
  const { t, locale } = useTranslation();
  const brand = useBrand();
  const senderName = getChatSenderName(message, t.chat.unnamedSender);
  const time = formatMessageClock(message.created_at, locale);
  const quote = quotedFromMessage(message, {
    unnamedSender: t.chat.unnamedSender,
    image: t.chat.attachment.image,
    file: t.chat.attachment.file,
  });
  const swipe = useSwipeToReply(
    onReply && canReplyToMessage(message) ? () => onReply(message) : undefined,
  );

  const staff = message.sender_detail?.is_staff === true;
  const bubble = (
    <Pressable
      accessibilityHint={t.chat.reactions.title}
      delayLongPress={280}
      onLongPress={() => onLongPressMessage(message)}
      style={[
        styles.bubble,
        own
          ? { backgroundColor: brand.primarySoft, borderColor: brand.primary }
          : styles.otherBubble,
        staff && !own ? { borderColor: brand.primary } : null,
        highlighted ? { backgroundColor: brand.secondarySoft, borderColor: brand.secondary } : null,
      ]}
    >
      {!own && (groupStart || staff) ? (
        <View style={styles.senderLine}>
          {staff ? <Icon color={brand.primary} name="shield" size={14} /> : null}
          <AppText color="brand" numberOfLines={1} variant="caption" weight="700">
            {senderName}
          </AppText>
        </View>
      ) : null}
      {quote ? <ReplyQuote onPress={onJumpToReply} quote={quote} /> : null}
      {message.content ? (
        <AppText align="auto" style={BODY_STYLE}>
          {message.content}
        </AppText>
      ) : null}
      {message.has_attachment ? (
        <AttachmentTile message={message} onOpen={onOpenAttachment} />
      ) : null}
      <ReactionChips message={message} />
      <View style={styles.metaLine}>
        {time ? (
          <AppText align="auto" color="muted" style={styles.time} variant="caption">
            {time}
          </AppText>
        ) : null}
        {own && delivery ? <DeliveryTicks state={delivery} /> : null}
      </View>
    </Pressable>
  );

  return (
    <View
      style={[styles.row, own ? styles.rowOwn : styles.rowOther, groupStart && styles.groupGap]}
    >
      <Animated.View
        {...swipe.handlers}
        style={[
          styles.swipe,
          own ? styles.rowOwn : styles.rowOther,
          { transform: [{ translateX: swipe.translateX }] },
        ]}
      >
        {own ? (
          bubble
        ) : (
          <Stack align="flex-end" direction="horizontal" gap="sm" style={styles.otherLine}>
            {groupStart ? (
              <AppAvatar name={senderName} size="sm" />
            ) : (
              <View style={{ width: AVATAR_SIZE }} />
            )}
            {bubble}
          </Stack>
        )}
      </Animated.View>
    </View>
  );
});

const PendingBubble = memo(function PendingBubble({
  pending,
  groupStart,
  onRetry,
  onDiscard,
}: {
  pending: PendingMessage;
  groupStart: boolean;
  onRetry: (localId: string) => void;
  onDiscard: (localId: string) => void;
}) {
  const { t, locale } = useTranslation();
  const brand = useBrand();
  const failed = pending.status === 'failed';
  const time = formatMessageClock(pending.createdAt, locale);
  const uploading = pending.attachment !== null;
  const percent = Math.round(pending.progress * 100);
  const pendingQuote = quotedFromPending(pending);

  return (
    <View style={[styles.row, styles.rowOwn, groupStart && styles.groupGap]}>
      <View
        style={[
          styles.bubble,
          { backgroundColor: brand.primarySoft, borderColor: brand.primary },
          failed ? styles.failedBubble : styles.sendingBubble,
        ]}
      >
        {pendingQuote ? <ReplyQuote quote={pendingQuote} /> : null}
        {pending.content ? (
          <AppText align="auto" style={BODY_STYLE}>
            {pending.content}
          </AppText>
        ) : null}
        {pending.attachment ? (
          <View style={styles.attachmentTile}>
            <Icon color={brand.primary} name="image" size={26} />
            <View style={styles.attachmentText}>
              <AppText color="brand" numberOfLines={1} variant="label" weight="600">
                {pending.attachment.name}
              </AppText>
              {pending.attachment.size > 0 ? (
                <AppText color="muted" variant="caption">
                  {t.chat.attachment.sizeLabel(formatMegabytes(pending.attachment.size))}
                </AppText>
              ) : null}
            </View>
          </View>
        ) : null}
        {uploading && !failed ? (
          <View accessibilityLabel={t.chat.sendingAttachment(percent)} style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { backgroundColor: brand.primary, width: `${Math.max(4, percent)}%` },
              ]}
            />
          </View>
        ) : null}

        <Stack align="center" direction="horizontal" gap="sm" wrap>
          {failed ? (
            <>
              <AppText
                accessibilityLiveRegion="polite"
                color="error"
                variant="caption"
                weight="600"
              >
                {pending.error ?? t.chat.failed}
              </AppText>
              <Pressable
                accessibilityLabel={t.chat.retrySend}
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => onRetry(pending.localId)}
                style={styles.action}
              >
                <AppText color="brand" variant="label" weight="700">
                  {t.chat.retrySend}
                </AppText>
              </Pressable>
              <Pressable
                accessibilityLabel={t.chat.discard}
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => onDiscard(pending.localId)}
                style={styles.action}
              >
                <AppText color="error" variant="label" weight="700">
                  {t.chat.discard}
                </AppText>
              </Pressable>
            </>
          ) : (
            <>
              <ActivityIndicator color={brand.primary} size="small" />
              <AppText color="muted" variant="caption">
                {uploading ? t.chat.sendingAttachment(percent) : t.chat.sending}
              </AppText>
              {uploading ? (
                <Pressable
                  accessibilityLabel={t.chat.cancelUpload}
                  accessibilityRole="button"
                  hitSlop={8}
                  onPress={() => onDiscard(pending.localId)}
                  style={styles.action}
                >
                  <AppText color="error" variant="label" weight="700">
                    {t.chat.cancelUpload}
                  </AppText>
                </Pressable>
              ) : null}
            </>
          )}
          {time ? (
            <AppText color="muted" variant="caption">
              {time}
            </AppText>
          ) : null}
        </Stack>
      </View>
    </View>
  );
});

/** One row of the inverted list. Memoised: it only re-renders when its own item changes. */
export const ChatMessageRow = memo(function ChatMessageRow({
  item,
  highlighted,
  onOpenAttachment,
  onLongPressMessage,
  onReply,
  onJumpToReply,
  onRetry,
  onDiscard,
}: ChatMessageRowProps) {
  switch (item.kind) {
    case 'day':
      return <DaySeparator date={item.date} />;
    case 'system':
      return <SystemRow message={item.message} />;
    case 'pending':
      return (
        <PendingBubble
          groupStart={item.groupStart}
          onDiscard={onDiscard}
          onRetry={onRetry}
          pending={item.pending}
        />
      );
    default:
      return (
        <MessageBubble
          delivery={item.delivery}
          groupStart={item.groupStart}
          highlighted={highlighted}
          message={item.message}
          onJumpToReply={onJumpToReply}
          onLongPressMessage={onLongPressMessage}
          onOpenAttachment={onOpenAttachment}
          onReply={onReply}
          own={item.own}
        />
      );
  }
});

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: spacing.md,
    marginTop: 2,
  },
  rowOwn: {
    alignItems: 'flex-start',
  },
  rowOther: {
    alignItems: 'flex-end',
  },
  swipe: {
    width: '100%',
  },
  groupGap: {
    marginTop: spacing.md,
  },
  otherLine: {
    maxWidth: '100%',
  },
  centerRow: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  pill: {
    maxWidth: '90%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.background.muted,
  },
  bubble: {
    maxWidth: '82%',
    flexShrink: 1,
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.xl,
    borderWidth: 1,
  },
  otherBubble: {
    backgroundColor: colors.background.surface,
    borderColor: colors.border.default,
  },
  sendingBubble: {
    borderStyle: 'dashed',
    opacity: 0.9,
  },
  failedBubble: {
    borderColor: colors.semantic.error,
  },
  time: {
    opacity: 0.9,
  },
  metaLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  ticks: {
    justifyContent: 'center',
  },
  senderLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  reactions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xxs,
  },
  reactionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.background.surface,
  },
  attachmentTile: {
    minHeight: layout.touchTargetMinSize,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.background.surface,
  },
  attachmentText: {
    flexShrink: 1,
  },
  pressed: {
    opacity: 0.7,
  },
  progressTrack: {
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.gray[200],
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    borderRadius: radius.full,
  },
  action: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
});
