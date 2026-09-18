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
import { useTranslation } from '../../../i18n';
import { formatTime } from '../../../utils/formatDateTime';
import { ProfileRoutes } from '../../../navigation/routes';
import type { ProfileStackParamList } from '../../../navigation/types';
import { spacing } from '../../../theme';
import { SupportTicketCard } from '../components';
import { useSupportStore } from '../store';

type SupportTicketsScreenProps = NativeStackScreenProps<ProfileStackParamList, 'SupportTickets'>;

export function SupportTicketsScreen({ navigation }: SupportTicketsScreenProps) {
  const { t, locale } = useTranslation();
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
          <AppHeader subtitle={t.support.subtitle} title={t.support.title} />
        </Stack>

        <AppCard variant="muted">
          <Stack gap="sm">
            <AppText color="secondary" variant="bodySmall">
              {t.support.intro}
            </AppText>
            <AppText color="muted" variant="caption">
              {t.support.ticketsCount(ticketsCount)}
            </AppText>
          </Stack>
        </AppCard>

        <AppButton fullWidth onPress={handleCreatePress} title={t.support.createTicket} />

        {successMessage ? (
          <AppCard variant="muted">
            <AppText color="success" variant="bodySmall">
              {successMessage}
            </AppText>
          </AppCard>
        ) : null}

        {errorMessage ? <ErrorState message={errorMessage} onRetry={handleRefresh} /> : null}

        {showInitialLoading ? (
          <LoadingState message={t.support.loading} />
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
                title={t.support.createFirstTicket}
                variant="outline"
              />
            }
            message={t.support.emptyMessage}
            title={t.support.emptyTitle}
            illustrationLabel={t.support.emptyIllustrationAlt}
            illustrationSource={images.emptyStates.supportTickets}
          />
        )}

        {lastLoadedAt ? (
          <AppText align="center" color="muted" variant="caption">
            {t.common.lastUpdatedAt(formatTime(lastLoadedAt, locale) ?? '')}
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
