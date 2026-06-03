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
          <AppButton onPress={onPress} title="فتح" variant="outline" />
        </Stack>
      </AppCard>
    </Pressable>
  );
}

export function GroupsOverviewScreen({ navigation }: GroupsOverviewScreenProps) {
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
        <AppHeader subtitle="الغروبات الأكاديمية" title="الغروبات" />

        <AppCard variant="muted">
          <AppText color="secondary" variant="bodySmall">
            انضم إلى الغروبات الأكاديمية المناسبة لبياناتك الجامعية.
          </AppText>
        </AppCard>

        <SectionHeader
          action={
            <AppButton
              loading={isRefreshing}
              onPress={handleRefresh}
              size="sm"
              title="تحديث"
              variant="outline"
            />
          }
          subtitle="يمكنك متابعة غروباتك أو تصفح الغروبات المتاحة حسب صلاحيات الباك إند."
          title="الوجهات"
        />

        {errorMessage ? <ErrorState message={errorMessage} onRetry={handleRefresh} /> : null}

        <Stack gap="md">
          <OverviewCard
            count={resolvedMyGroupsCount}
            description="الغروبات التي تملك عضوية فيها أو طلبات مرتبطة بحسابك."
            onPress={() => navigation.navigate(GroupsRoutes.MyGroups)}
            title="غروباتي"
          />
          <OverviewCard
            count={resolvedAvailableCount}
            description="الغروبات التي يمكنك طلب الانضمام إليها حسب بياناتك وحالة توثيقك."
            onPress={() => navigation.navigate(GroupsRoutes.AvailableGroups)}
            title="الغروبات المتاحة"
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
