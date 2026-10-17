import { useCallback, useEffect, useMemo } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { images } from '../../../assets/images';
import {
  AppButton,
  AppCard,
  AppHeader,
  AppScreen,
  AppText,
  ChoiceChips,
  EmptyState,
  ErrorState,
  LoadingState,
  Stack,
} from '../../../components';
import { useTranslation } from '../../../i18n';
import { ProfileRoutes } from '../../../navigation/routes';
import type { ProfileStackParamList } from '../../../navigation/types';
import { layout, spacing, useBrand } from '../../../theme';
import { SupportTicketCard } from '../components';
import { getSupportTicketStatusLabel } from '../services';
import { useSupportStore } from '../store';
import type { SupportTicket } from '../types';

type SupportTicketsScreenProps = NativeStackScreenProps<ProfileStackParamList, 'SupportTickets'>;

const FILTER_STATUSES = ['open', 'in_progress', 'waiting_user', 'resolved', 'closed'] as const;

function keyExtractor(ticket: SupportTicket) {
  return String(ticket.id);
}

function Separator() {
  return <View style={styles.separator} />;
}

export function SupportTicketsScreen({ navigation }: SupportTicketsScreenProps) {
  const { t } = useTranslation();
  const brand = useBrand();
  const tickets = useSupportStore((state) => state.tickets);
  const ticketsCount = useSupportStore((state) => state.ticketsCount);
  const nextPage = useSupportStore((state) => state.nextTicketsPage);
  const statusFilter = useSupportStore((state) => state.statusFilter);
  const isLoadingTickets = useSupportStore((state) => state.isLoadingTickets);
  const isLoadingMore = useSupportStore((state) => state.isLoadingMoreTickets);
  const isRefreshing = useSupportStore((state) => state.isRefreshing);
  const errorMessage = useSupportStore((state) => state.errorMessage);
  const successMessage = useSupportStore((state) => state.successMessage);
  const loadMyTickets = useSupportStore((state) => state.loadMyTickets);
  const loadMoreTickets = useSupportStore((state) => state.loadMoreTickets);
  const refreshMyTickets = useSupportStore((state) => state.refreshMyTickets);
  const clearMessages = useSupportStore((state) => state.clearMessages);
  const setSelectedTicket = useSupportStore((state) => state.setSelectedTicket);
  const hasLoaded = useSupportStore((state) => state.lastLoadedAt !== null);

  useEffect(() => {
    clearMessages();
    void loadMyTickets();
  }, [clearMessages, loadMyTickets]);

  const handleCreate = useCallback(
    () => navigation.navigate(ProfileRoutes.CreateSupportTicket),
    [navigation],
  );
  const handleRefresh = useCallback(() => void refreshMyTickets(), [refreshMyTickets]);
  const handleEndReached = useCallback(() => void loadMoreTickets(), [loadMoreTickets]);
  const handleFilter = useCallback((status: string) => void loadMyTickets(status), [loadMyTickets]);
  const handleOpen = useCallback(
    (ticket: SupportTicket) => {
      setSelectedTicket(ticket);
      navigation.navigate(ProfileRoutes.TicketDetails, { ticketId: ticket.id });
    },
    [navigation, setSelectedTicket],
  );
  const renderItem = useCallback(
    ({ item }: { item: SupportTicket }) => (
      <SupportTicketCard onPress={() => handleOpen(item)} ticket={item} />
    ),
    [handleOpen],
  );
  const filterOptions = useMemo(
    () => [
      { value: '', label: t.support.filterAll },
      ...FILTER_STATUSES.map((status) => ({
        value: status as string,
        label: getSupportTicketStatusLabel(status, t.support, t.common.unknown),
      })),
    ],
    [t],
  );

  const header = (
    <Stack gap="lg" style={styles.header}>
      <AppHeader subtitle={t.support.subtitle} title={t.support.title} />
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
      <AppButton fullWidth onPress={handleCreate} title={t.support.createTicket} />
      <ChoiceChips
        label={t.support.filterLabel}
        onChange={handleFilter}
        options={filterOptions}
        value={statusFilter}
      />
      {successMessage ? (
        <AppCard variant="muted">
          <AppText color="success" variant="bodySmall">
            {successMessage}
          </AppText>
        </AppCard>
      ) : null}
    </Stack>
  );

  if (isLoadingTickets && tickets.length === 0 && !hasLoaded) {
    return (
      <AppScreen contentContainerStyle={styles.centerContent} scroll>
        {header}
        <LoadingState message={t.support.loading} />
      </AppScreen>
    );
  }

  if (errorMessage && tickets.length === 0) {
    return (
      <AppScreen contentContainerStyle={styles.centerContent} scroll>
        {header}
        <ErrorState message={errorMessage} onRetry={handleRefresh} />
      </AppScreen>
    );
  }

  return (
    <AppScreen horizontalPadding={false}>
      <FlatList
        ItemSeparatorComponent={Separator}
        ListEmptyComponent={
          isLoadingTickets ? (
            <LoadingState message={t.support.loading} />
          ) : statusFilter ? (
            <EmptyState
              action={
                <AppButton
                  onPress={() => handleFilter('')}
                  title={t.support.filterAll}
                  variant="outline"
                />
              }
              message={t.support.filteredEmptyMessage}
              title={t.support.filteredEmptyTitle}
            />
          ) : (
            <EmptyState
              action={
                <AppButton
                  onPress={handleCreate}
                  title={t.support.createFirstTicket}
                  variant="outline"
                />
              }
              illustrationLabel={t.support.emptyIllustrationAlt}
              illustrationSource={images.emptyStates.supportTickets}
              message={t.support.emptyMessage}
              title={t.support.emptyTitle}
            />
          )
        }
        ListFooterComponent={
          <View style={styles.footer}>
            {isLoadingMore ? <ActivityIndicator color={brand.primary} /> : null}
            {errorMessage && tickets.length > 0 ? (
              <Stack align="center" gap="sm">
                <AppText align="center" color="error" variant="bodySmall">
                  {errorMessage}
                </AppText>
                <AppButton
                  onPress={handleEndReached}
                  size="sm"
                  title={t.common.retry}
                  variant="outline"
                />
              </Stack>
            ) : null}
            {!isLoadingMore && !errorMessage && nextPage !== null ? (
              <AppButton
                onPress={handleEndReached}
                size="sm"
                title={t.support.loadMore}
                variant="outline"
              />
            ) : null}
          </View>
        }
        ListHeaderComponent={header}
        contentContainerStyle={styles.listContent}
        data={tickets}
        initialNumToRender={8}
        keyExtractor={keyExtractor}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            colors={[brand.primary]}
            onRefresh={handleRefresh}
            refreshing={isRefreshing}
            tintColor={brand.primary}
          />
        }
        removeClippedSubviews
        renderItem={renderItem}
        windowSize={7}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  centerContent: { gap: spacing.xl },
  header: { marginBottom: spacing.lg },
  listContent: {
    paddingHorizontal: layout.screenHorizontalPadding,
    paddingTop: layout.screenVerticalPadding,
    paddingBottom: layout.screenVerticalPadding,
    flexGrow: 1,
  },
  separator: { height: spacing.md },
  footer: { paddingVertical: spacing.lg, alignItems: 'center', minHeight: spacing.xxl },
});
