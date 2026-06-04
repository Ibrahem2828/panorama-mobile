import { useEffect, useMemo } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet } from 'react-native';

import {
  AppButton,
  AppHeader,
  AppScreen,
  ErrorState,
  LoadingState,
  Stack,
} from '../../../components';
import type { GroupsStackParamList } from '../../../navigation/types';
import { spacing } from '../../../theme';
import { useAuthStore } from '../../auth/store';
import { useGroupsStore } from '../../groups/store';
import { canSendMessageToGroup } from '../services';
import { useChatStore } from '../store';
import {
  ChatConnectionStatusIndicator,
  ChatEmptyState,
  ChatMessageBubble,
  ChatMessageInput,
  ChatPermissionNotice,
  ChatRoomHeader,
} from '../components';

type ChatRoomScreenProps = NativeStackScreenProps<GroupsStackParamList, 'ChatRoom'>;

function isSameId(left: string | number, right: string | number): boolean {
  return String(left) === String(right);
}

export function ChatRoomScreen({ navigation, route }: ChatRoomScreenProps) {
  const { groupId } = route.params;
  const currentUserId = useAuthStore((state) => state.user?.id ?? null);
  const selectedGroup = useGroupsStore((state) => state.selectedGroup);
  const availableGroups = useGroupsStore((state) => state.availableGroups);
  const myGroups = useGroupsStore((state) => state.myGroups);
  const isLoadingDetail = useGroupsStore((state) => state.isLoadingDetail);
  const loadGroupDetail = useGroupsStore((state) => state.loadGroupDetail);
  const messagesByGroupId = useChatStore((state) => state.messagesByGroupId);
  const draftByGroupId = useChatStore((state) => state.draftByGroupId);
  const connectionStatus = useChatStore((state) => state.connectionStatus);
  const isLoadingMessages = useChatStore((state) => state.isLoadingMessages);
  const isRefreshing = useChatStore((state) => state.isRefreshing);
  const isSending = useChatStore((state) => state.isSending);
  const errorMessage = useChatStore((state) => state.errorMessage);
  const loadMessages = useChatStore((state) => state.loadMessages);
  const refreshMessages = useChatStore((state) => state.refreshMessages);
  const sendMessage = useChatStore((state) => state.sendMessage);
  const setDraftMessage = useChatStore((state) => state.setDraftMessage);
  const connectGroupChat = useChatStore((state) => state.connectGroupChat);
  const disconnectGroupChat = useChatStore((state) => state.disconnectGroupChat);
  const clearError = useChatStore((state) => state.clearError);

  const group = useMemo(() => {
    if (selectedGroup && isSameId(selectedGroup.id, groupId)) {
      return selectedGroup;
    }

    return (
      [...myGroups, ...availableGroups].find((candidate) => isSameId(candidate.id, groupId)) ?? null
    );
  }, [availableGroups, groupId, myGroups, selectedGroup]);

  const groupKey = String(groupId);
  const messages = messagesByGroupId[groupKey] ?? [];
  const draft = draftByGroupId[groupKey] ?? '';
  const permission = group
    ? canSendMessageToGroup(group, currentUserId)
    : {
        allowed: false,
        reason: 'جاري تحميل صلاحيات الغروب.',
        permission: 'unknown' as const,
      };
  const showInitialLoading = (isLoadingMessages || isLoadingDetail) && messages.length === 0;

  useEffect(() => {
    clearError();
    void loadGroupDetail(groupId);
    void loadMessages(groupId);
    connectGroupChat(groupId);

    return () => {
      disconnectGroupChat();
    };
  }, [clearError, connectGroupChat, disconnectGroupChat, groupId, loadGroupDetail, loadMessages]);

  function handleRefresh() {
    void loadGroupDetail(groupId);
    void refreshMessages(groupId);
  }

  function handleSend() {
    void sendMessage(groupId);
  }

  return (
    <AppScreen contentContainerStyle={styles.content} scroll>
      <Stack gap="xl">
        <Stack gap="md">
          <AppHeader subtitle="محادثة نصية داخل الغروب" title="المحادثة" />
          <Stack direction="horizontal" gap="sm" wrap>
            <AppButton onPress={() => navigation.goBack()} title="رجوع" variant="ghost" />
            <AppButton
              loading={isRefreshing}
              onPress={handleRefresh}
              title="تحديث"
              variant="outline"
            />
          </Stack>
        </Stack>

        <ChatRoomHeader connectionStatus={connectionStatus} group={group} />
        <ChatConnectionStatusIndicator status={connectionStatus} />

        {errorMessage ? <ErrorState message={errorMessage} onRetry={handleRefresh} /> : null}

        {showInitialLoading ? (
          <LoadingState message="جاري تحميل الرسائل..." />
        ) : messages.length > 0 ? (
          <Stack gap="md">
            {messages.map((message) => (
              <ChatMessageBubble
                currentUserId={currentUserId}
                key={String(message.id)}
                message={message}
              />
            ))}
          </Stack>
        ) : (
          <ChatEmptyState />
        )}

        {permission.allowed ? (
          <ChatMessageInput
            loading={isSending}
            onChangeText={(value) => setDraftMessage(groupId, value)}
            onSubmit={handleSend}
            value={draft}
          />
        ) : (
          <ChatPermissionNotice permission={permission.permission} reason={permission.reason} />
        )}
      </Stack>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
  },
});
