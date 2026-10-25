import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { ActivityIndicator, FlatList, Platform, Pressable, StyleSheet, View } from 'react-native';

import { AppText, Icon } from '../../../components';
import { radius, shadows, spacing, useBrand } from '../../../theme';
import { useTranslation } from '../../../i18n';
import { buildChatItems, countNewIncoming } from '../logic/timeline';
import type { ChatListItem, ChatMessage, Id, PendingMessage } from '../types';
import { ChatMessageRow } from './ChatMessageRow';

/** Distance from the newest message (px) past which the "jump to latest" button appears. */
const SCROLL_BUTTON_OFFSET = 240;
/** Within this distance of the bottom, new messages keep the view pinned to the newest one. */
const AUTOSCROLL_THRESHOLD = 80;

type ChatMessageListProps = {
  messages: readonly ChatMessage[];
  pending: readonly PendingMessage[];
  currentUserId: Id | null;
  hasOlder: boolean;
  isLoadingOlder: boolean;
  loadOlderFailed: boolean;
  onLoadOlder: () => void;
  peerCursors: Readonly<Record<number, { delivered: number; read: number }>>;
  onOpenAttachment: (message: ChatMessage) => void;
  onLongPressMessage: (message: ChatMessage) => void;
  onRetry: (localId: string) => void;
  onDiscard: (localId: string) => void;
};

const keyExtractor = (item: ChatListItem) => item.key;

const MAINTAIN_POSITION = {
  minIndexForVisible: 0,
  autoscrollToTopThreshold: AUTOSCROLL_THRESHOLD,
} as const;

const ListFooter = memo(function ListFooter({
  hasOlder,
  isLoadingOlder,
  loadOlderFailed,
  onLoadOlder,
}: Pick<ChatMessageListProps, 'hasOlder' | 'isLoadingOlder' | 'loadOlderFailed' | 'onLoadOlder'>) {
  const { t } = useTranslation();
  const brand = useBrand();

  if (isLoadingOlder) {
    return (
      <View accessibilityLiveRegion="polite" style={styles.footer}>
        <ActivityIndicator color={brand.primary} size="small" />
        <AppText color="muted" variant="caption">
          {t.chat.loadingOlder}
        </AppText>
      </View>
    );
  }

  if (loadOlderFailed || hasOlder) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={onLoadOlder}
        style={[styles.footer, styles.footerAction]}
      >
        <AppText color={loadOlderFailed ? 'error' : 'brand'} variant="label" weight="600">
          {loadOlderFailed ? t.chat.loadOlderFailed : t.chat.loadOlder}
        </AppText>
      </Pressable>
    );
  }

  return <View style={styles.footerSpacer} />;
});

/**
 * Inverted list (index 0 = newest, drawn at the bottom). Older history is appended to the
 * end of the data, so loading it never moves what the user is reading; new messages are
 * added at index 0 and `maintainVisibleContentPosition` keeps the reading position when the
 * user has scrolled up.
 */
export const ChatMessageList = memo(function ChatMessageList({
  messages,
  pending,
  currentUserId,
  hasOlder,
  isLoadingOlder,
  loadOlderFailed,
  onLoadOlder,
  peerCursors,
  onOpenAttachment,
  onLongPressMessage,
  onRetry,
  onDiscard,
}: ChatMessageListProps) {
  const { t } = useTranslation();
  const brand = useBrand();
  const listRef = useRef<FlatList<ChatListItem>>(null);
  const atBottomRef = useRef(true);
  const previousNewestIdRef = useRef<number | null>(null);
  const previousPendingCountRef = useRef(pending.length);
  const [showJump, setShowJump] = useState(false);
  const [unseen, setUnseen] = useState(0);

  const items = useMemo(
    () => buildChatItems(messages, pending, currentUserId, peerCursors),
    [messages, pending, currentUserId, peerCursors],
  );

  const newestId = messages.length > 0 ? (messages[messages.length - 1]?.id ?? null) : null;

  // Count messages that arrive while the user is reading older history.
  useEffect(() => {
    const previous = previousNewestIdRef.current;

    previousNewestIdRef.current = newestId;

    if (previous === null || newestId === null || newestId <= previous) {
      return;
    }

    if (!atBottomRef.current) {
      const added = countNewIncoming(messages, previous, currentUserId);

      if (added > 0) {
        setUnseen((count) => count + added);
      }
    }
  }, [messages, newestId, currentUserId]);

  // Sending your own message always brings you to it.
  useEffect(() => {
    if (pending.length > previousPendingCountRef.current) {
      listRef.current?.scrollToOffset({ offset: 0, animated: true });
    }

    previousPendingCountRef.current = pending.length;
  }, [pending.length]);

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offset = event.nativeEvent.contentOffset.y;
    const nearBottom = offset <= AUTOSCROLL_THRESHOLD;

    atBottomRef.current = nearBottom;
    setShowJump((current) => {
      const next = offset > SCROLL_BUTTON_OFFSET;

      return current === next ? current : next;
    });

    if (nearBottom) {
      setUnseen((count) => (count === 0 ? count : 0));
    }
  }, []);

  const handleJumpToLatest = useCallback(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
    setUnseen(0);
  }, []);

  const handleEndReached = useCallback(() => {
    if (hasOlder && !isLoadingOlder && !loadOlderFailed) {
      onLoadOlder();
    }
  }, [hasOlder, isLoadingOlder, loadOlderFailed, onLoadOlder]);

  const renderItem = useCallback(
    ({ item }: { item: ChatListItem }) => (
      <ChatMessageRow
        item={item}
        onDiscard={onDiscard}
        onLongPressMessage={onLongPressMessage}
        onOpenAttachment={onOpenAttachment}
        onRetry={onRetry}
      />
    ),
    [onDiscard, onLongPressMessage, onOpenAttachment, onRetry],
  );

  const footer = useMemo(
    () => (
      <ListFooter
        hasOlder={hasOlder}
        isLoadingOlder={isLoadingOlder}
        loadOlderFailed={loadOlderFailed}
        onLoadOlder={onLoadOlder}
      />
    ),
    [hasOlder, isLoadingOlder, loadOlderFailed, onLoadOlder],
  );

  return (
    <View style={styles.container}>
      <FlatList
        accessibilityLabel={t.chat.messagesLog}
        contentContainerStyle={styles.content}
        data={items}
        initialNumToRender={14}
        inverted
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        keyExtractor={keyExtractor}
        ListFooterComponent={footer}
        maintainVisibleContentPosition={MAINTAIN_POSITION}
        maxToRenderPerBatch={10}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.6}
        onScroll={handleScroll}
        ref={listRef}
        removeClippedSubviews={Platform.OS === 'android'}
        renderItem={renderItem}
        scrollEventThrottle={64}
        showsVerticalScrollIndicator={false}
        updateCellsBatchingPeriod={40}
        windowSize={9}
      />

      {showJump ? (
        <View pointerEvents="box-none" style={styles.jumpWrapper}>
          <Pressable
            accessibilityLabel={
              unseen > 0
                ? `${t.chat.newMessages(unseen)}. ${t.chat.jumpToLatest}`
                : t.chat.jumpToLatest
            }
            accessibilityRole="button"
            onPress={handleJumpToLatest}
            style={[styles.jumpButton, { backgroundColor: brand.primary }]}
          >
            {unseen > 0 ? (
              <AppText color="inverse" variant="label" weight="700">
                {t.chat.newMessages(unseen)}
              </AppText>
            ) : null}
            <Icon color={brand.onPrimary} name="chevronDown" size={20} />
          </Pressable>
        </View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingVertical: spacing.sm,
  },
  footer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.lg,
  },
  footerAction: {
    minHeight: 48,
  },
  footerSpacer: {
    height: spacing.lg,
  },
  jumpWrapper: {
    position: 'absolute',
    bottom: spacing.md,
    start: 0,
    end: 0,
    alignItems: 'center',
  },
  jumpButton: {
    minHeight: 44,
    minWidth: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    ...shadows.sm,
  },
});
