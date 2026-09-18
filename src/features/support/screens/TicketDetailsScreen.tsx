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
import { useTranslation } from '../../../i18n';
import type { ProfileStackParamList } from '../../../navigation/types';
import { spacing } from '../../../theme';
import { SupportMessageBubble, SupportMessageInput, SupportTicketSummaryCard } from '../components';
import { canReplyToSupportTicket } from '../services';
import { useFeedbackStore } from '../../feedback/store';
import { useSupportStore } from '../store';

type TicketDetailsScreenProps = NativeStackScreenProps<ProfileStackParamList, 'TicketDetails'>;

export function TicketDetailsScreen({ navigation, route }: TicketDetailsScreenProps) {
  const { t } = useTranslation();
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
  const requestFeedbackPrompt = useFeedbackStore((state) => state.requestPrompt);

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

  useEffect(() => {
    if (activeTicket?.status && ['resolved', 'closed'].includes(activeTicket.status)) {
      void requestFeedbackPrompt({
        context: 'support',
        actionKey: 'support.ticket.resolved',
        objectType: 'support_ticket',
        objectId: activeTicket.id,
        metadata: { status: activeTicket.status },
      });
    }
  }, [activeTicket, requestFeedbackPrompt]);

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
          <AppHeader subtitle={t.support.details.subtitle} title={t.support.details.title} />
          <Stack direction="horizontal" gap="sm" wrap>
            <AppButton onPress={() => navigation.goBack()} title={t.common.back} variant="ghost" />
            <AppButton onPress={handleRefresh} title={t.common.refresh} variant="outline" />
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
          <LoadingState message={t.support.details.loading} />
        ) : activeTicket ? (
          <Stack gap="xl">
            <SupportTicketSummaryCard ticket={activeTicket} />

            <Stack gap="md">
              <SectionHeader
                subtitle={t.support.details.messagesSubtitle}
                title={t.support.details.messagesTitle}
              />
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
                  message={t.support.details.noMessagesMessage}
                  title={t.support.details.noMessagesTitle}
                />
              )}
            </Stack>

            <Stack gap="md">
              <SectionHeader
                subtitle={t.support.details.addMessageSubtitle}
                title={t.support.details.addMessageTitle}
              />
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
                    {t.support.validation.closedTicket}
                  </AppText>
                </AppCard>
              )}
            </Stack>
          </Stack>
        ) : (
          <EmptyState
            action={
              <AppButton
                onPress={handleRefresh}
                title={t.support.details.reload}
                variant="outline"
              />
            }
            message={t.support.details.notFoundMessage}
            title={t.support.details.notFoundTitle}
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
