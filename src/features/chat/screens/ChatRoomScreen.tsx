import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeyboardOverlap } from '../../../hooks/useKeyboardOverlap';

import {
  AppButton,
  AppScreen,
  AppText,
  EmptyState,
  ErrorState,
  LoadingState,
} from '../../../components';
import type { GroupsStackParamList } from '../../../navigation/types';
import { colors, spacing } from '../../../theme';
import { useTranslation } from '../../../i18n';
import { useAuthStore } from '../../auth/store';
import { getGroupDisplayName, getGroupSubjectId } from '../../groups/services';
import { useGroupsStore } from '../../groups/store';
import {
  ChatAttachmentViewer,
  ChatComposer,
  ChatEmptyState,
  ChatMessageList,
  ChatPermissionNotice,
  ChatMuteSheet,
  ChatRoomHeader,
  MessageActionsSheet,
} from '../components';
import { isEffectivelyMuted } from '../logic/mute';
import { useMuteNow } from '../components/useMuteExpiry';
import { canOpenGroupChat, canSendMessageToGroup } from '../services';
import { useChatStore } from '../store';
import { useChatMuteStore } from '../store/chatMuteStore';
import type { ChatAttachment, ChatMessage } from '../types';

type ChatRoomScreenProps = NativeStackScreenProps<GroupsStackParamList, 'ChatRoom'>;

const NO_CURSORS = {} as const;

function isSameId(left: string | number, right: string | number): boolean {
  return String(left) === String(right);
}

export function ChatRoomScreen({ navigation, route }: ChatRoomScreenProps) {
  const safeInsets = useSafeAreaInsets();
  // The tab bar height already includes the bottom inset, which the keyboard also covers.
  const keyboardOverlap = useKeyboardOverlap(useBottomTabBarHeight() - safeInsets.bottom);
  const { t } = useTranslation();
  const { groupId } = route.params;
  const groupKey = String(groupId);
  const currentUserId = useAuthStore((state) => state.user?.id ?? null);
  const selectedGroup = useGroupsStore((state) => state.selectedGroup);
  const availableGroups = useGroupsStore((state) => state.availableGroups);
  const myGroups = useGroupsStore((state) => state.myGroups);
  const isLoadingDetail = useGroupsStore((state) => state.isLoadingDetail);
  const loadGroupDetail = useGroupsStore((state) => state.loadGroupDetail);
  const room = useChatStore((state) => state.rooms[groupKey]);
  const connectionStatus = useChatStore((state) => state.connectionStatus);
  const isOnline = useChatStore((state) => state.isOnline);
  const openRoom = useChatStore((state) => state.openRoom);
  const closeRoom = useChatStore((state) => state.closeRoom);
  const refresh = useChatStore((state) => state.refresh);
  const loadOlder = useChatStore((state) => state.loadOlder);
  const sendMessage = useChatStore((state) => state.send);
  const retry = useChatStore((state) => state.retry);
  const discard = useChatStore((state) => state.discard);
  const react = useChatStore((state) => state.react);
  const deleteMessage = useChatStore((state) => state.deleteMessage);
  const mutePref = useChatMuteStore((state) => state.byGroup[groupKey]);
  const loadMute = useChatMuteStore((state) => state.loadOne);
  const muteNow = useMuteNow(mutePref);
  const [muteOpen, setMuteOpen] = useState(false);
  const [viewerMessage, setViewerMessage] = useState<ChatMessage | null>(null);
  const [actionMessage, setActionMessage] = useState<ChatMessage | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const group = useMemo(() => {
    if (selectedGroup && isSameId(selectedGroup.id, groupId)) {
      return selectedGroup;
    }

    return (
      [...myGroups, ...availableGroups].find((candidate) => isSameId(candidate.id, groupId)) ?? null
    );
  }, [availableGroups, groupId, myGroups, selectedGroup]);

  // Only approved members may open the chat. `null` while the group is still unknown.
  const canOpen = group ? canOpenGroupChat(group) : null;
  const permission = useMemo(
    () => canSendMessageToGroup(group, currentUserId, t.chat),
    [group, currentUserId, t.chat],
  );

  useEffect(() => {
    void loadGroupDetail(groupId);
  }, [groupId, loadGroupDetail]);

  useEffect(() => {
    void loadMute(groupId);
  }, [groupId, loadMute]);

  useEffect(() => {
    if (canOpen !== true) {
      return undefined;
    }

    openRoom(groupId);

    return () => closeRoom();
  }, [canOpen, closeRoom, groupId, openRoom]);

  const handleBack = useCallback(() => navigation.goBack(), [navigation]);
  const handleRefresh = useCallback(() => void refresh(groupId), [groupId, refresh]);
  const handleLoadOlder = useCallback(() => void loadOlder(groupId), [groupId, loadOlder]);
  const handleRetry = useCallback((localId: string) => retry(groupId, localId), [groupId, retry]);
  const handleDiscard = useCallback(
    (localId: string) => discard(groupId, localId),
    [discard, groupId],
  );
  const handleSend = useCallback(
    (input: { text: string; attachment: ChatAttachment | null }) => sendMessage(groupId, input),
    [groupId, sendMessage],
  );
  const handleCloseViewer = useCallback(() => setViewerMessage(null), []);
  const handleCloseActions = useCallback(() => setActionMessage(null), []);
  const handleReact = useCallback(
    (message: ChatMessage, emoji: string | null) => react(groupId, message.id, emoji),
    [groupId, react],
  );
  const handleDelete = useCallback(
    async (message: ChatMessage) => {
      setActionError(null);

      if (!(await deleteMessage(groupId, message.id))) {
        setActionError(t.chat.actions.deleteFailed);
      }
    },
    [deleteMessage, groupId, t.chat.actions.deleteFailed],
  );
  const handleOpenMute = useCallback(() => setMuteOpen(true), []);
  const handleCloseMute = useCallback(() => setMuteOpen(false), []);
  // Members may delete their own messages; moderators and group admins may delete any.
  const canModerate = ['moderator', 'group_admin', 'admin'].includes(
    String(group?.current_user_group_role ?? ''),
  );

  const header = (
    <ChatRoomHeader
      connectionStatus={connectionStatus}
      group={group}
      isMuted={isEffectivelyMuted(mutePref, muteNow)}
      isOnline={isOnline}
      onBack={handleBack}
      onOpenMute={handleOpenMute}
    />
  );

  let body: ReactNode;

  if (canOpen === false || room?.forbidden) {
    const isPending = group?.current_user_membership_status === 'pending';
    const wasRemoved = canOpen === true && room?.forbidden === true;

    body = (
      <EmptyState
        action={<AppButton onPress={handleBack} title={t.chat.guard.back} variant="outline" />}
        message={
          wasRemoved
            ? t.chat.guard.removedMessage
            : isPending
              ? t.chat.guard.pendingMessage
              : t.chat.guard.message
        }
        style={styles.centered}
        title={wasRemoved ? t.chat.guard.removedTitle : t.chat.guard.title}
      />
    );
  } else if (canOpen === null) {
    body = isLoadingDetail ? (
      <LoadingState message={t.chat.permission.loading} />
    ) : (
      <ErrorState
        message={t.chat.errors.generic}
        onRetry={() => void loadGroupDetail(groupId)}
        style={styles.centered}
      />
    );
  } else {
    const messages = room?.messages ?? [];
    const pending = room?.pending ?? [];
    const isEmpty = messages.length === 0 && pending.length === 0;
    const showLoading = !room || (!room.hasLoaded && room.isLoading);

    body = (
      <>
        {!isOnline ? (
          <View accessibilityLiveRegion="polite" style={styles.offlineBanner}>
            <AppText align="center" color="inverse" variant="caption">
              {t.chat.connection.offlineBanner}
            </AppText>
          </View>
        ) : null}

        {actionError ? (
          <Pressable onPress={() => setActionError(null)} style={styles.errorStrip}>
            <AppText color="error" style={styles.errorText} variant="caption">
              {actionError}
            </AppText>
          </Pressable>
        ) : null}

        {room?.error && messages.length > 0 ? (
          <View style={styles.errorStrip}>
            <AppText color="error" style={styles.errorText} variant="caption">
              {room.error}
            </AppText>
            <AppButton
              loading={room.isRefreshing}
              onPress={handleRefresh}
              size="sm"
              title={t.common.retry}
              variant="ghost"
            />
          </View>
        ) : null}

        {showLoading ? (
          <LoadingState message={t.chat.loadingMessages} />
        ) : room?.error && isEmpty ? (
          <ErrorState message={room.error} onRetry={handleRefresh} style={styles.centered} />
        ) : isEmpty ? (
          <View style={styles.centered}>
            <ChatEmptyState />
          </View>
        ) : (
          <ChatMessageList
            currentUserId={currentUserId}
            hasOlder={room?.hasOlder ?? false}
            isLoadingOlder={room?.isLoadingOlder ?? false}
            loadOlderFailed={room?.loadOlderFailed ?? false}
            messages={messages}
            onDiscard={handleDiscard}
            onLoadOlder={handleLoadOlder}
            onLongPressMessage={setActionMessage}
            onOpenAttachment={setViewerMessage}
            onRetry={handleRetry}
            peerCursors={room?.peerCursors ?? NO_CURSORS}
            pending={pending}
          />
        )}

        {permission.allowed ? (
          <ChatComposer groupId={groupId} onSend={handleSend} />
        ) : (
          <ChatPermissionNotice permission={permission.permission} reason={permission.reason} />
        )}
      </>
    );
  }

  return (
    <AppScreen horizontalPadding={false} style={styles.screen}>
      {header}
      <View style={[styles.flex, { paddingBottom: keyboardOverlap }]}>{body}</View>
      <ChatAttachmentViewer groupId={groupId} message={viewerMessage} onClose={handleCloseViewer} />
      <ChatMuteSheet
        onClose={handleCloseMute}
        target={
          muteOpen
            ? {
                groupId,
                name: group ? getGroupDisplayName(group, t.groups) : t.chat.title,
                kind: group && getGroupSubjectId(group) ? 'subject' : 'community',
              }
            : null
        }
      />
      <MessageActionsSheet
        canDelete={
          actionMessage !== null &&
          (canModerate || String(actionMessage.sender) === String(currentUserId))
        }
        message={actionMessage}
        onClose={handleCloseActions}
        onDelete={(message) => void handleDelete(message)}
        onReact={handleReact}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background.primary,
  },
  flex: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  offlineBanner: {
    backgroundColor: colors.semantic.error,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  errorStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingStart: spacing.md,
    backgroundColor: colors.background.muted,
  },
  errorText: {
    flex: 1,
  },
});
