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

const WHATSAPP_OPEN_ERROR = 'تعذر فتح رابط واتساب.';

function isSameId(left: Id, right: Id): boolean {
  return String(left) === String(right);
}

export function GroupDetailsScreen({ navigation, route }: GroupDetailsScreenProps) {
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
      setWhatsAppErrorMessage(WHATSAPP_OPEN_ERROR);
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
      setWhatsAppErrorMessage(WHATSAPP_OPEN_ERROR);
    } finally {
      setIsOpeningWhatsApp(false);
    }
  }

  if (showInitialLoading) {
    return (
      <AppScreen contentContainerStyle={styles.content} scroll>
        <AppHeader subtitle="تفاصيل المجموعة" title="المجموعات" />
        <LoadingState message="جاري تحميل تفاصيل المجموعة..." />
      </AppScreen>
    );
  }

  if (!activeGroup) {
    return (
      <AppScreen contentContainerStyle={styles.content} scroll>
        <Stack gap="lg">
          <AppHeader subtitle="تفاصيل المجموعة" title="المجموعات" />
          <AppButton
            onPress={() => navigation.goBack()}
            title="رجوع إلى المجموعات"
            variant="ghost"
          />
          <ErrorState
            message={errorMessage ?? 'تعذر تحميل تفاصيل المجموعة.'}
            onRetry={handleRetry}
            title="المجموعة غير متاح"
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
            <AppButton onPress={() => navigation.goBack()} title="رجوع" variant="ghost" />
          }
          subtitle="تفاصيل المجموعة"
          title="المجموعات"
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
            <AppButton loading={isSubmittingMembership} onPress={handleJoin} title="طلب الانضمام" />
          ) : null}
          {canLeaveGroup(activeGroup) ? (
            <AppButton
              loading={isSubmittingMembership}
              onPress={handleLeave}
              title="مغادرة المجموعة"
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
            subtitle="المحادثة مؤجلة، وملفات المجموعة أصبحت متاحة حسب صلاحيات الباك إند."
            title="محتوى المجموعة"
          />
          <AppCard variant="muted">
            <Stack gap="sm">
              <AppText variant="title">المحادثة</AppText>
              <AppText color="secondary" variant="bodySmall">
                افتح المحادثة النصية داخل التطبيق. صلاحية الإرسال تعرض داخل شاشة المحادثة حسب عضوية
                المجموعة وقواعد الخادم.
              </AppText>
              <AppButton
                onPress={handleOpenChatRoom}
                title="فتح المحادثة داخل التطبيق"
                variant="outline"
              />
            </Stack>
          </AppCard>
          <AppCard variant="muted">
            <Stack gap="sm">
              <AppText variant="title">ملفات المجموعة</AppText>
              <AppText color="secondary" variant="bodySmall">
                افتح الملفات المرتبطة بهذا المجموعة داخل التطبيق بدون زر تنزيل مباشر.
              </AppText>
              <AppButton
                onPress={handleOpenGroupFiles}
                title="فتح ملفات المجموعة"
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
