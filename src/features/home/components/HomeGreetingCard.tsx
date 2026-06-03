import { StyleSheet, View } from 'react-native';

import { AppBadge, AppCard, AppText, Stack } from '../../../components';
import { colors, spacing } from '../../../theme';

type HomeGreetingCardProps = {
  displayName?: string | null;
  userRole?: string | null;
  unreadNotificationsCount: number;
};

function getGreeting(displayName?: string | null): string {
  if (displayName?.trim()) {
    return `مرحبا، ${displayName.trim()}`;
  }

  return 'مرحبا بك في بانوراما';
}

export function HomeGreetingCard({
  displayName,
  userRole,
  unreadNotificationsCount,
}: HomeGreetingCardProps) {
  return (
    <AppCard padding="lg" variant="elevated">
      <Stack gap="md">
        <View style={styles.header}>
          <View style={styles.titleBlock}>
            <AppText variant="h2">{getGreeting(displayName)}</AppText>
            <AppText color="secondary" variant="body">
              كل جامعتك في مكان واحد
            </AppText>
          </View>
          {unreadNotificationsCount > 0 ? (
            <AppBadge label={`${unreadNotificationsCount} جديد`} size="md" variant="warning" />
          ) : null}
        </View>

        {userRole ? (
          <AppText color="muted" variant="caption">
            نوع الحساب: {userRole}
          </AppText>
        ) : null}
      </Stack>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.default,
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
});
