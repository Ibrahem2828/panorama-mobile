import { useEffect, useMemo } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet } from 'react-native';

import {
  AppButton,
  AppCard,
  AppHeader,
  AppScreen,
  AppText,
  EmptyState,
  ErrorState,
  LoadingState,
  SectionHeader,
  Stack,
} from '../../../components';
import type { ProfileStackParamList } from '../../../navigation/types';
import { spacing } from '../../../theme';
import { SupportMessageBubble, SupportMessageInput, SupportTicketSummaryCard } from '../components';
import { canReplyToSupportTicket } from '../services';
import { useSupportStore } from '../store';

type TicketDetailsScreenProps = NativeStackScreenProps<ProfileStackParamList, 'TicketDetails'>;

const CLOSED_REPLY_MESSAGE = 'لا يمكن إضافة رسائل جديدة على تذكرة مغلقة أو محلولة.';

export function TicketDetailsScreen({ navigation, route }: TicketDetailsScreenProps) {
  const { ticketId } = route.params;
  const tickets = useSupportStore((state) => state.tickets);
  const selectedTicket = useSupportStore((state) => state.selectedTicket);
  const replyMessage = useSupportStore((state) => state.replyMessage);
  const validation = useSupportStore((state) => state.validation);
  const isLoadingDetail = useSupportStore((state) => state.isLoadingDetail);
  const isSendingMessage = useSupportStore((state) => state.isSendingMessage);
  const errorMessage = useSupportStore((state) => state.errorMessage);
  const successMessage = useSupportStore((state) => state.successMessage);
  const loadTicketDetail = useSupportStore((state) => state.loadTicketDetail);
  const addMessage = useSupportStore((state) => state.addMessage);
  const setReplyMessage = useSupportStore((state) => state.setReplyMessage);
  const clearMessages = useSupportStore((state) => state.clearMessages);

  const activeTicket = useMemo(() => {
    if (selectedTicket && String(selectedTicket.id) === String(ticketId)) {
      return selectedTicket;
    }

    return tickets.find((ticket) => String(ticket.id) === String(ticketId)) ?? null;
  }, [selectedTicket, ticketId, tickets]);

  useEffect(() => {
    clearMessages();
    void loadTicketDetail(ticketId);
  }, [clearMessages, loadTicketDetail, ticketId]);

  function handleRefresh() {
    void loadTicketDetail(ticketId);
  }

  function handleSendMessage() {
    void addMessage(ticketId);
  }

  const messages = activeTicket?.messages ?? [];
  const canReply = activeTicket ? canReplyToSupportTicket(activeTicket) : false;
  const showInitialLoading = isLoadingDetail && !activeTicket;

  return (
    <AppScreen contentContainerStyle={styles.content} scroll>
      <Stack gap="xl">
        <Stack gap="md">
          <AppHeader subtitle="متابعة المحادثة مع فريق الدعم" title="تفاصيل التذكرة" />
          <Stack direction="horizontal" gap="sm" wrap>
            <AppButton onPress={() => navigation.goBack()} title="رجوع" variant="ghost" />
            <AppButton onPress={handleRefresh} title="تحديث" variant="outline" />
          </Stack>
        </Stack>

        {successMessage ? (
          <AppCard variant="muted">
            <AppText color="success" variant="bodySmall">
              {successMessage}
            </AppText>
          </AppCard>
        ) : null}

        {errorMessage ? <ErrorState message={errorMessage} onRetry={handleRefresh} /> : null}

        {showInitialLoading ? (
          <LoadingState message="جاري تحميل تفاصيل التذكرة..." />
        ) : activeTicket ? (
          <Stack gap="xl">
            <SupportTicketSummaryCard ticket={activeTicket} />

            <Stack gap="md">
              <SectionHeader subtitle="الرسائل المرتبطة بهذه التذكرة" title="سجل الرسائل" />
              {messages.length > 0 ? (
                <Stack gap="md">
                  {messages.map((message, index) => (
                    <SupportMessageBubble
                      key={String(message.id ?? `${activeTicket.id}-${index}`)}
                      message={message}
                    />
                  ))}
                </Stack>
              ) : (
                <EmptyState
                  message="ستظهر ردود فريق الدعم والرسائل الإضافية هنا عند توفرها."
                  title="لا توجد رسائل إضافية"
                />
              )}
            </Stack>

            <Stack gap="md">
              <SectionHeader subtitle="إرسال تحديث لفريق الدعم" title="إضافة رسالة" />
              {canReply ? (
                <SupportMessageInput
                  error={validation.replyMessage}
                  loading={isSendingMessage}
                  onChangeText={setReplyMessage}
                  onSubmit={handleSendMessage}
                  value={replyMessage}
                />
              ) : (
                <AppCard variant="muted">
                  <AppText color="muted" variant="bodySmall">
                    {CLOSED_REPLY_MESSAGE}
                  </AppText>
                </AppCard>
              )}
            </Stack>
          </Stack>
        ) : (
          <EmptyState
            action={<AppButton onPress={handleRefresh} title="إعادة التحميل" variant="outline" />}
            message="تعذر العثور على التذكرة محليا. حاول إعادة التحميل."
            title="التذكرة غير متوفرة"
          />
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
