import { useEffect } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { memo, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  AppBadge,
  AppCard,
  AppHeader,
  AppScreen,
  AppText,
  BrandRefreshControl,
  ErrorState,
  Icon,
  IconTile,
  SectionHeader,
  Stack,
  type IconName,
} from '../../../components';
import { useTranslation } from '../../../i18n';
import { GroupsRoutes } from '../../../navigation/routes';
import type { GroupsStackParamList } from '../../../navigation/types';
import { colors, spacing } from '../../../theme';
import { getIsRTL } from '../../../utils/rtl';
import { useGroupsStore } from '../store';

type GroupsOverviewScreenProps = NativeStackScreenProps<GroupsStackParamList, 'GroupsOverview'>;

type OverviewCardProps = {
  title: string;
  description: string;
  count: number;
  icon: IconName;
  onPress: () => void;
};

function OverviewCardComponent({ title, description, count, icon, onPress }: OverviewCardProps) {
  return (
    <AppCard accessibilityLabel={title} onPress={onPress} variant="elevated">
      <View style={styles.cardRow}>
        <IconTile icon={icon} size="lg" />
        <View style={styles.cardText}>
          <AppText variant="title">{title}</AppText>
          <AppText color="secondary" variant="bodySmall">
            {description}
          </AppText>
        </View>
        <View style={styles.cardEnd}>
          <AppBadge label={String(count)} variant="brand" />
          <Icon
            color={colors.text.muted}
            name={getIsRTL() ? 'chevronLeft' : 'chevronRight'}
            size={18}
          />
        </View>
      </View>
    </AppCard>
  );
}

const OverviewCard = memo(OverviewCardComponent);

export function GroupsOverviewScreen({ navigation }: GroupsOverviewScreenProps) {
  const { t } = useTranslation();
  const availableCount = useGroupsStore((state) => state.availableCount);
  const myGroupsCount = useGroupsStore((state) => state.myGroupsCount);
  const availableGroups = useGroupsStore((state) => state.availableGroups);
  const myGroups = useGroupsStore((state) => state.myGroups);
  const errorMessage = useGroupsStore((state) => state.errorMessage);
  const isRefreshing = useGroupsStore((state) => state.isRefreshing);
  const loadAvailableGroups = useGroupsStore((state) => state.loadAvailableGroups);
  const loadMyGroups = useGroupsStore((state) => state.loadMyGroups);
  const refreshAllGroups = useGroupsStore((state) => state.refreshAllGroups);
  const resolvedAvailableCount = availableCount || availableGroups.length;
  const resolvedMyGroupsCount = myGroupsCount || myGroups.length;

  useEffect(() => {
    void loadAvailableGroups({ search: '', subjectId: null });
    void loadMyGroups();
  }, [loadAvailableGroups, loadMyGroups]);

  const handleRefresh = useCallback(() => {
    void refreshAllGroups();
  }, [refreshAllGroups]);
  const openMyGroups = useCallback(() => navigation.navigate(GroupsRoutes.MyGroups), [navigation]);
  const openAvailable = useCallback(
    () => navigation.navigate(GroupsRoutes.AvailableGroups),
    [navigation],
  );

  return (
    <AppScreen
      contentContainerStyle={styles.content}
      refreshControl={<BrandRefreshControl onRefresh={handleRefresh} refreshing={isRefreshing} />}
      scroll
    >
      <Stack gap="xl">
        <AppHeader subtitle={t.groups.overview.subtitle} title={t.groups.title} />

        <AppCard variant="muted">
          <AppText color="secondary" variant="bodySmall">
            {t.groups.overview.intro}
          </AppText>
        </AppCard>

        <SectionHeader
          subtitle={t.groups.overview.destinationsSubtitle}
          title={t.groups.overview.destinationsTitle}
        />

        {errorMessage ? <ErrorState message={errorMessage} onRetry={handleRefresh} /> : null}

        <Stack gap="md">
          <OverviewCard
            count={resolvedMyGroupsCount}
            description={t.groups.overview.myGroupsDescription}
            icon="users"
            onPress={openMyGroups}
            title={t.groups.mine.title}
          />
          <OverviewCard
            count={resolvedAvailableCount}
            description={t.groups.overview.availableDescription}
            icon="search"
            onPress={openAvailable}
            title={t.groups.available.title}
          />
        </Stack>
      </Stack>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  cardText: {
    flex: 1,
    minWidth: 0,
  },
  cardEnd: {
    alignItems: 'center',
    gap: spacing.sm,
  },
});
