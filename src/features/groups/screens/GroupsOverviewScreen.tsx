import { useEffect } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, StyleSheet } from 'react-native';

import {
  AppBadge,
  AppButton,
  AppCard,
  AppHeader,
  AppScreen,
  AppText,
  ErrorState,
  SectionHeader,
  Stack,
} from '../../../components';
import { useTranslation } from '../../../i18n';
import { GroupsRoutes } from '../../../navigation/routes';
import type { GroupsStackParamList } from '../../../navigation/types';
import { opacity, spacing } from '../../../theme';
import { useGroupsStore } from '../store';

type GroupsOverviewScreenProps = NativeStackScreenProps<GroupsStackParamList, 'GroupsOverview'>;

type OverviewCardProps = {
  title: string;
  description: string;
  count: number;
  onPress: () => void;
};

function OverviewCard({ title, description, count, onPress }: OverviewCardProps) {
  const { t } = useTranslation();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [pressed ? styles.pressed : null]}
    >
      <AppCard variant="elevated">
        <Stack gap="md">
          <Stack direction="horizontal" gap="md" style={styles.cardHeader}>
            <Stack gap="xs" style={styles.cardText}>
              <AppText variant="title">{title}</AppText>
              <AppText color="secondary" variant="bodySmall">
                {description}
              </AppText>
            </Stack>
            <AppBadge label={String(count)} variant="brand" />
          </Stack>
          <AppButton onPress={onPress} title={t.common.open} variant="outline" />
        </Stack>
      </AppCard>
    </Pressable>
  );
}

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
    void loadAvailableGroups();
    void loadMyGroups();
  }, [loadAvailableGroups, loadMyGroups]);

  function handleRefresh() {
    void refreshAllGroups();
  }

  return (
    <AppScreen contentContainerStyle={styles.content} scroll>
      <Stack gap="xl">
        <AppHeader subtitle={t.groups.overview.subtitle} title={t.groups.title} />

        <AppCard variant="muted">
          <AppText color="secondary" variant="bodySmall">
            {t.groups.overview.intro}
          </AppText>
        </AppCard>

        <SectionHeader
          action={
            <AppButton
              loading={isRefreshing}
              onPress={handleRefresh}
              size="sm"
              title={t.common.refresh}
              variant="outline"
            />
          }
          subtitle={t.groups.overview.destinationsSubtitle}
          title={t.groups.overview.destinationsTitle}
        />

        {errorMessage ? <ErrorState message={errorMessage} onRetry={handleRefresh} /> : null}

        <Stack gap="md">
          <OverviewCard
            count={resolvedMyGroupsCount}
            description={t.groups.overview.myGroupsDescription}
            onPress={() => navigation.navigate(GroupsRoutes.MyGroups)}
            title={t.groups.mine.title}
          />
          <OverviewCard
            count={resolvedAvailableCount}
            description={t.groups.overview.availableDescription}
            onPress={() => navigation.navigate(GroupsRoutes.AvailableGroups)}
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
  cardHeader: {
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  cardText: {
    flex: 1,
    minWidth: 0,
  },
  pressed: {
    opacity: opacity.pressed,
  },
});
