import { memo, useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { AppAvatar, AppText, Icon, Stack } from '../../../components';
import { colors, layout, radius, spacing, useBrand } from '../../../theme';
import { useTranslation } from '../../../i18n';
import { getChatSenderName } from '../logic/messages';
import { getDayLabel } from '../logic/timeline';
import type { ChatListItem, ChatMessage, PendingMessage } from '../types';
import { formatMegabytes, formatMessageClock, formatMessageDay } from './chatFormat';

const AVATAR_SIZE = layout.avatar.sm;

/** Message bodies follow their own script direction so mixed Arabic/English text reads right. */
const BODY_STYLE = { writingDirection: 'auto' } as const;

type RowCallbacks = {
  onOpenAttachment: (message: ChatMessage) => void;
  onRetry: (localId: string) => void;
  onDiscard: (localId: string) => void;
};

type ChatMessageRowProps = RowCallbacks & {
  item: ChatListItem;
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
        <AppText color="brand" variant="label" weight="600">
          {label}
        </AppText>
        <AppText color="muted" variant="caption">
          {t.chat.attachment.tapToView}
        </AppText>
      </View>
    </Pressable>
  );
}

const MessageBubble = memo(function MessageBubble({
  message,
  own,
  groupStart,
  onOpenAttachment,
}: {
  message: ChatMessage;
  own: boolean;
  groupStart: boolean;
  onOpenAttachment: (message: ChatMessage) => void;
}) {
  const { t, locale } = useTranslation();
  const brand = useBrand();
  const senderName = getChatSenderName(message, t.chat.unnamedSender);
  const time = formatMessageClock(message.created_at, locale);

  const bubble = (
    <View
      style={[
        styles.bubble,
        own
          ? { backgroundColor: brand.primarySoft, borderColor: brand.primary }
          : styles.otherBubble,
      ]}
    >
      {!own && groupStart ? (
        <AppText color="brand" numberOfLines={1} variant="caption" weight="700">
          {senderName}
        </AppText>
      ) : null}
      {message.content ? (
        <AppText align="auto" selectable style={BODY_STYLE}>
          {message.content}
        </AppText>
      ) : null}
      {message.has_attachment ? (
        <AttachmentTile message={message} onOpen={onOpenAttachment} />
      ) : null}
      {time ? (
        <AppText align="auto" color="muted" style={styles.time} variant="caption">
          {time}
        </AppText>
      ) : null}
    </View>
  );

  return (
    <View
      style={[styles.row, own ? styles.rowOwn : styles.rowOther, groupStart && styles.groupGap]}
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

  return (
    <View style={[styles.row, styles.rowOwn, groupStart && styles.groupGap]}>
      <View
        style={[
          styles.bubble,
          { backgroundColor: brand.primarySoft, borderColor: brand.primary },
          failed ? styles.failedBubble : styles.sendingBubble,
        ]}
      >
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
  onOpenAttachment,
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
          groupStart={item.groupStart}
          message={item.message}
          onOpenAttachment={onOpenAttachment}
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
