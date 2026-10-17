import { useCallback, useEffect } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RefreshControl, ScrollView, StyleSheet } from 'react-native';

import {
  AppButton,
  AppCard,
  AppHeader,
  AppScreen,
  AppText,
  ErrorState,
  Icon,
  LoadingState,
  SectionHeader,
  Stack,
} from '../../../components';
import { useTranslation } from '../../../i18n';
import { GroupsRoutes } from '../../../navigation/routes';
import type { GroupsStackParamList } from '../../../navigation/types';
import { colors, layout, spacing, useBrand } from '../../../theme';
import {
  GroupDetailHeader,
  GroupMembershipActions,
  GroupPermissionCard,
  GroupWhatsAppCard,
} from '../components';
import { getGroupSubjectId, resolveMembershipState } from '../services';
import { useGroupsStore } from '../store';
import type { Id } from '../types';

type GroupDetailsScreenProps = NativeStackScreenProps<GroupsStackParamList, 'GroupDetails'>;

function isSameId(left: Id, right: Id): boolean {
  return String(left) === String(right);
}

export function GroupDetailsScreen({ navigation, route }: GroupDetailsScreenProps) {
  const { t } = useTranslation();
  const brand = useBrand();
  const { groupId } = route.params;
  const selectedGroup = useGroupsStore((state) => state.selectedGroup);
  const isLoadingDetail = useGroupsStore((state) => state.isLoadingDetail);
  const errorMessage = useGroupsStore((state) => state.errorMessage);
  const actionError = useGroupsStore((state) => state.actionError);
  const successMessage = useGroupsStore((state) => state.successMessage);
  const pendingActions = useGroupsStore((state) => state.pendingActions);
  const subjectLabels = useGroupsStore((state) => state.subjectLabels);
  const loadGroupDetail = useGroupsStore((state) => state.loadGroupDetail);
  const loadSubjectLabels = useGroupsStore((state) => state.loadSubjectLabels);
  const joinGroup = useGroupsStore((state) => state.joinGroup);
  const leaveGroup = useGroupsStore((state) => state.leaveGroup);
  const clearError = useGroupsStore((state) => state.clearError);
  const activeGroup = selectedGroup && isSameId(selectedGroup.id, groupId) ? selectedGroup : null;

  useEffect(() => {
    void loadGroupDetail(groupId);
    void loadSubjectLabels();
  }, [groupId, loadGroupDetail, loadSubjectLabels]);

  useEffect(() => clearError, [clearError]);

  const handleRefresh = useCallback(() => {
    void loadGroupDetail(groupId);
  }, [groupId, loadGroupDetail]);

  const handleJoin = useCallback(
    (id: Id) => {
      void joinGroup(id);
    },
    [joinGroup],
  );

  const handleLeave = useCallback(
    (id: Id) => {
      void leaveGroup(id);
    },
    [leaveGroup],
  );

  if (!activeGroup) {
    return (
      <AppScreen contentContainerStyle={styles.content} scroll>
        <Stack gap="lg">
          <AppHeader subtitle={t.groups.details.subtitle} title={t.groups.title} />
          {isLoadingDetail ? (
            <LoadingState message={t.groups.details.loading} />
          ) : (
            <ErrorState
              message={errorMessage ?? t.groups.details.unavailableMessage}
              onRetry={handleRefresh}
              title={t.groups.details.unavailableTitle}
            />
          )}
        </Stack>
      </AppScreen>
    );
  }

  const membership = resolveMembershipState(activeGroup);
  const subjectKey = getGroupSubjectId(activeGroup);
  const subject = subjectKey ? subjectLabels[subjectKey] : null;

  return (
    <AppScreen>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            colors={[brand.primary]}
            progressBackgroundColor={colors.background.elevated}
            onRefresh={handleRefresh}
            refreshing={isLoadingDetail}
            tintColor={brand.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <Stack gap="xl">
          <AppHeader subtitle={t.groups.details.subtitle} title={t.groups.title} />

          <GroupDetailHeader group={activeGroup} subject={subject} />

          {successMessage ? (
            <AppCard variant="muted">
              <AppText color="success" variant="bodySmall">
                {successMessage}
              </AppText>
            </AppCard>
          ) : null}
          {actionError ? (
            <AppText color="error" variant="bodySmall">
              {actionError}
            </AppText>
          ) : null}
          {errorMessage ? <ErrorState message={errorMessage} onRetry={handleRefresh} /> : null}

          <GroupMembershipActions
            group={activeGroup}
            onJoin={handleJoin}
            onLeave={handleLeave}
            pendingAction={pendingActions[String(activeGroup.id)]}
          />

          {membership.canOpenContent || activeGroup.has_whatsapp_channel ? (
            <GroupWhatsAppCard canLaunch={membership.canOpenContent} groupId={activeGroup.id} />
          ) : null}

          <Stack gap="md">
            <SectionHeader
              subtitle={t.groups.details.contentSubtitle}
              title={t.groups.details.contentTitle}
            />
            <AppCard variant="muted">
              <Stack gap="sm">
                <Stack align="center" direction="horizontal" gap="sm">
                  <Icon color={brand.primary} name="chat" size={20} />
                  <AppText variant="title">{t.groups.details.chatTitle}</AppText>
                </Stack>
                <AppText color="secondary" variant="bodySmall">
                  {t.groups.details.chatDescription}
                </AppText>
                <AppButton
                  disabled={!membership.canOpenContent}
                  onPress={() => navigation.navigate(GroupsRoutes.ChatRoom, { groupId })}
                  title={t.groups.details.openChat}
                  variant="outline"
                />
              </Stack>
            </AppCard>
            <AppCard variant="muted">
              <Stack gap="sm">
                <Stack align="center" direction="horizontal" gap="sm">
                  <Icon color={brand.primary} name="file" size={20} />
                  <AppText variant="title">{t.groups.details.filesTitle}</AppText>
                </Stack>
                <AppText color="secondary" variant="bodySmall">
                  {t.groups.details.filesDescription}
                </AppText>
                <AppButton
                  disabled={!membership.canOpenContent}
                  onPress={() => navigation.navigate(GroupsRoutes.GroupFiles, { groupId })}
                  title={t.groups.details.openFiles}
                  variant="outline"
                />
              </Stack>
            </AppCard>
            {!membership.canOpenContent ? (
              <AppText color="muted" variant="caption">
                {t.groups.notices.membersOnly}
              </AppText>
            ) : null}
          </Stack>

          {membership.canOpenContent ? (
            <GroupPermissionCard
              currentUserGroupRole={activeGroup.current_user_group_role}
              sendMessagesPermission={activeGroup.send_messages_permission}
            />
          ) : null}
        </Stack>
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
    paddingBottom: layout.screenVerticalPadding,
    paddingTop: layout.screenVerticalPadding,
  },
});
