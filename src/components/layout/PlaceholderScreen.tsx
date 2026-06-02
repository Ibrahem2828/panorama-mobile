import { StyleSheet } from 'react-native';

import { spacing } from '../../theme';
import { AppBadge, AppText } from '../common';
import { AppCard } from './AppCard';
import { AppHeader } from './AppHeader';
import { AppScreen } from './AppScreen';
import { Stack } from './Stack';

type PlaceholderScreenProps = {
  title: string;
  subtitle?: string;
  badge?: string;
  description?: string;
};

export function PlaceholderScreen({
  title,
  subtitle = 'بنية التنقل',
  badge = 'Phase 3',
  description = 'هذه شاشة مبدئية ضمن بنية التنقل. سيتم تنفيذ التفاصيل الوظيفية في مرحلة لاحقة.',
}: PlaceholderScreenProps) {
  return (
    <AppScreen contentContainerStyle={styles.content} scroll>
      <AppHeader subtitle={subtitle} title={title} />
      <AppCard padding="lg" variant="default">
        <Stack gap="md">
          <AppBadge label={badge} variant="brand" />
          <AppText variant="title">{title}</AppText>
          <AppText color="secondary" variant="body">
            {description}
          </AppText>
          <AppText color="muted" variant="caption">
            لا يوجد Auth أو API أو منطق منتج فعلي في هذه الشاشة.
          </AppText>
        </Stack>
      </AppCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
  },
});
