import { useEffect } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet } from 'react-native';

import { images } from '../../../assets/images';

import {
  AppButton,
  AppCard,
  AppHeader,
  AppScreen,
  AppText,
  EmptyState,
  ErrorState,
  LoadingState,
  Stack,
} from '../../../components';
import { ProfileRoutes } from '../../../navigation/routes';
import type { ProfileStackParamList } from '../../../navigation/types';
import { spacing } from '../../../theme';
import { SupportTicketCard } from '../components';
import { useSupportStore } from '../store';

type SupportTicketsScreenProps = NativeStackScreenProps<ProfileStackParamList, 'SupportTickets'>;

export function SupportTicketsScreen({ navigation }: SupportTicketsScreenProps) {
  const tickets = useSupportStore((state) => state.tickets);
  const ticketsCount = useSupportStore((state) => state.ticketsCount);
  const isLoadingTickets = useSupportStore((state) => state.isLoadingTickets);
  const isRefreshing = useSupportStore((state) => state.isRefreshing);
  const errorMessage = useSupportStore((state) => state.errorMessage);
  const successMessage = useSupportStore((state) => state.successMessage);
  const lastLoadedAt = useSupportStore((state) => state.lastLoadedAt);
  const loadMyTickets = useSupportStore((state) => state.loadMyTickets);
  const refreshMyTickets = useSupportStore((state) => state.refreshMyTickets);
  const clearMessages = useSupportStore((state) => state.clearMessages);
  const setSelectedTicket = useSupportStore((state) => state.setSelectedTicket);

  useEffect(() => {
    clearMessages();
    void loadMyTickets();
  }, [clearMessages, loadMyTickets]);

  function handleCreatePress() {
    navigation.navigate(ProfileRoutes.CreateSupportTicket);
  }

  function handleRefresh() {
    void refreshMyTickets();
  }

  const showInitialLoading = isLoadingTickets && tickets.length === 0;

  return (
    <AppScreen contentContainerStyle={styles.content} scroll>
      <Stack gap="xl">
        <Stack gap="md">
          <AppHeader subtitle="تذاكر دعم الطلاب" title="الدعم الفني" />
          <Stack direction="horizontal" gap="sm" wrap>
            <AppButton onPress={() => navigation.goBack()} title="رجوع" variant="ghost" />
            <AppButton onPress={handleRefresh} title="تحديث" variant="outline" />
          </Stack>
        </Stack>

        <AppCard variant="muted">
          <Stack gap="sm">
            <AppText color="secondary" variant="bodySmall">
              يمكنك إنشاء تذكرة دعم ومتابعة الردود الخاصة بك فقط. لا توجد مرفقات أو محادثة فورية في
              هذه المرحلة.
            </AppText>
            <AppText color="muted" variant="caption">
              عدد التذاكر: {ticketsCount}
            </AppText>
          </Stack>
        </AppCard>

        <AppButton fullWidth onPress={handleCreatePress} title="إنشاء تذكرة جديدة" />

        {successMessage ? (
          <AppCard variant="muted">
            <AppText color="success" variant="bodySmall">
              {successMessage}
            </AppText>
          </AppCard>
        ) : null}

        {errorMessage ? <ErrorState message={errorMessage} onRetry={handleRefresh} /> : null}

        {showInitialLoading ? (
          <LoadingState message="جاري تحميل تذاكر الدعم..." />
        ) : tickets.length > 0 ? (
          <Stack gap="md">
            {tickets.map((ticket) => (
              <SupportTicketCard
                key={String(ticket.id)}
                onPress={() => {
                  setSelectedTicket(ticket);
                  navigation.navigate(ProfileRoutes.TicketDetails, { ticketId: ticket.id });
                }}
                ticket={ticket}
              />
            ))}
          </Stack>
        ) : (
          <EmptyState
            action={
              <AppButton
                loading={isRefreshing}
                onPress={handleCreatePress}
                title="إنشاء أول تذكرة"
                variant="outline"
              />
            }
            message="لم يتم إنشاء أي تذاكر دعم بعد."
            title="لا توجد تذاكر دعم"
            illustrationLabel="رسم يوضح عدم وجود تذاكر دعم"
            illustrationSource={images.emptyStates.supportTickets}
          />
        )}

        {lastLoadedAt ? (
          <AppText align="center" color="muted" variant="caption">
            آخر تحديث: {new Date(lastLoadedAt).toLocaleTimeString('ar-SY')}
          </AppText>
        ) : null}
      </Stack>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
  },
});
