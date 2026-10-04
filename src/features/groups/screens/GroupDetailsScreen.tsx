import { useEffect, useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Linking, StyleSheet } from 'react-native';

import {
  AppButton,
  AppCard,
  AppHeader,
  AppScreen,
  AppText,
  ErrorState,
  LoadingState,
  SectionHeader,
  Stack,
} from '../../../components';
import { useTranslation } from '../../../i18n';
import { GroupsRoutes } from '../../../navigation/routes';
import type { GroupsStackParamList } from '../../../navigation/types';
import { spacing } from '../../../theme';
import { isTrustedBackendUrl } from '../../../utils/trustedUrl';
import { useAuthStore } from '../../auth/store';
import { useFeedbackStore } from '../../feedback/store';
import { GroupDescriptionCard, GroupDetailHeader, GroupPermissionCard } from '../components';
import { canLeaveGroup, canRequestJoin, requestWhatsAppAccess } from '../services';
import { useGroupsStore } from '../store';
import type { Id } from '../types';

type GroupDetailsScreenProps = NativeStackScreenProps<GroupsStackParamList, 'GroupDetails'>;

function isSameId(left: Id, right: Id): boolean {
  return String(left) === String(right);
}

export function GroupDetailsScreen({ navigation, route }: GroupDetailsScreenProps) {
  const { t } = useTranslation();
  const { groupId } = route.params;
  const accessToken = useAuthStore((state) => state.accessToken);
  const requestFeedbackPrompt = useFeedbackStore((state) => state.requestPrompt);
  const selectedGroup = useGroupsStore((state) => state.selectedGroup);
  const isLoadingDetail = useGroupsStore((state) => state.isLoadingDetail);
  const isSubmittingMembership = useGroupsStore((state) => state.isSubmittingMembership);
  const errorMessage = useGroupsStore((state) => state.errorMessage);
  const successMessage = useGroupsStore((state) => state.successMessage);
  const loadGroupDetail = useGroupsStore((state) => state.loadGroupDetail);
  const joinGroup = useGroupsStore((state) => state.joinGroup);
  const leaveGroup = useGroupsStore((state) => state.leaveGroup);
  const [isOpeningWhatsApp, setIsOpeningWhatsApp] = useState(false);
  const [whatsAppErrorMessage, setWhatsAppErrorMessage] = useState<string | null>(null);
  const activeGroup = selectedGroup && isSameId(selectedGroup.id, groupId) ? selectedGroup : null;
  const showInitialLoading = isLoadingDetail && !activeGroup;

  useEffect(() => {
    void loadGroupDetail(groupId);
  }, [groupId, loadGroupDetail]);

  function handleRetry() {
    void loadGroupDetail(groupId);
  }

  function handleJoin() {
    void joinGroup(groupId);
  }

  function handleLeave() {
    void leaveGroup(groupId);
  }

  function handleOpenGroupFiles() {
    navigation.navigate(GroupsRoutes.GroupFiles, { groupId });
  }

  function handleOpenChatRoom() {
    navigation.navigate(GroupsRoutes.ChatRoom, { groupId });
  }

  async function handleOpenWhatsApp() {
    if (!accessToken || !activeGroup?.has_whatsapp_channel) {
      setWhatsAppErrorMessage(t.groups.details.whatsAppError);
      return;
    }

    setIsOpeningWhatsApp(true);
    setWhatsAppErrorMessage(null);

    try {
      const ticket = await requestWhatsAppAccess(groupId, accessToken);
      const trusted = isTrustedBackendUrl(ticket.open_url, {
        pathPrefixes: ['/api/v1/external-channels/open/'],
        allowHttpInDevelopment: true,
      });
      if (!trusted) throw new Error('untrusted_url');
      const supported = await Linking.canOpenURL(ticket.open_url);
      if (!supported) throw new Error('unsupported');
      await Linking.openURL(ticket.open_url);
      void requestFeedbackPrompt({
        context: 'group',
        actionKey: 'group.whatsapp.opened',
        objectType: 'group',
        objectId: groupId,
      });
    } catch {
      setWhatsAppErrorMessage(t.groups.details.whatsAppError);
    } finally {
      setIsOpeningWhatsApp(false);
    }
  }

  if (showInitialLoading) {
    return (
      <AppScreen contentContainerStyle={styles.content} scroll>
        <AppHeader subtitle={t.groups.details.subtitle} title={t.groups.title} />
        <LoadingState message={t.groups.details.loading} />
      </AppScreen>
    );
  }

  if (!activeGroup) {
    return (
      <AppScreen contentContainerStyle={styles.content} scroll>
        <Stack gap="lg">
          <AppHeader subtitle={t.groups.details.subtitle} title={t.groups.title} />
          <AppButton
            onPress={() => navigation.goBack()}
            title={t.groups.details.backToGroups}
            variant="ghost"
          />
          <ErrorState
            message={errorMessage ?? t.groups.details.unavailableMessage}
            onRetry={handleRetry}
            title={t.groups.details.unavailableTitle}
          />
        </Stack>
      </AppScreen>
    );
  }

  return (
    <AppScreen contentContainerStyle={styles.content} scroll>
      <Stack gap="xl">
        <AppHeader
          leftAction={
            <AppButton onPress={() => navigation.goBack()} title={t.common.back} variant="ghost" />
          }
          subtitle={t.groups.details.subtitle}
          title={t.groups.title}
        />

        <GroupDetailHeader group={activeGroup} />

        {successMessage ? (
          <AppCard variant="muted">
            <AppText color="success" variant="bodySmall">
              {successMessage}
            </AppText>
          </AppCard>
        ) : null}

        {errorMessage ? <ErrorState message={errorMessage} onRetry={handleRetry} /> : null}

        <Stack direction="horizontal" gap="md" wrap>
          {canRequestJoin(activeGroup) ? (
            <AppButton
              loading={isSubmittingMembership}
              onPress={handleJoin}
              title={t.groups.details.join}
            />
          ) : null}
          {canLeaveGroup(activeGroup) ? (
            <AppButton
              loading={isSubmittingMembership}
              onPress={handleLeave}
              title={t.groups.details.leave}
              variant="danger"
            />
          ) : null}
        </Stack>

        <GroupDescriptionCard
          description={activeGroup.description}
          isOpeningWhatsApp={isOpeningWhatsApp}
          hasWhatsAppChannel={activeGroup.has_whatsapp_channel}
          onOpenWhatsApp={activeGroup.has_whatsapp_channel ? handleOpenWhatsApp : undefined}
          whatsAppErrorMessage={whatsAppErrorMessage}
        />

        <GroupPermissionCard
          currentUserGroupRole={activeGroup.current_user_group_role}
          sendMessagesPermission={activeGroup.send_messages_permission}
        />

        <Stack gap="md">
          <SectionHeader
            subtitle={t.groups.details.contentSubtitle}
            title={t.groups.details.contentTitle}
          />
          <AppCard variant="muted">
            <Stack gap="sm">
              <AppText variant="title">{t.groups.details.chatTitle}</AppText>
              <AppText color="secondary" variant="bodySmall">
                {t.groups.details.chatDescription}
              </AppText>
              <AppButton
                onPress={handleOpenChatRoom}
                title={t.groups.details.openChat}
                variant="outline"
              />
            </Stack>
          </AppCard>
          <AppCard variant="muted">
            <Stack gap="sm">
              <AppText variant="title">{t.groups.details.filesTitle}</AppText>
              <AppText color="secondary" variant="bodySmall">
                {t.groups.details.filesDescription}
              </AppText>
              <AppButton
                onPress={handleOpenGroupFiles}
                title={t.groups.details.openFiles}
                variant="outline"
              />
            </Stack>
          </AppCard>
        </Stack>
      </Stack>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
  },
});
