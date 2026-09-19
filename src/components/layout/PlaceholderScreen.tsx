import { StyleSheet } from 'react-native';

import { spacing } from '../../theme';
import { AppBadge, AppText } from '../common';
import { AppCard } from './AppCard';
import { AppHeader } from './AppHeader';
import { AppScreen } from './AppScreen';
import { Stack } from './Stack';
import { useTranslation } from '../../i18n';

type PlaceholderScreenProps = {
  title: string;
  subtitle?: string;
  badge?: string;
  description?: string;
};

export function PlaceholderScreen({
  title,
  subtitle,
  badge = 'Phase 3',
  description,
}: PlaceholderScreenProps) {
  const { t } = useTranslation();
  return (
    <AppScreen contentContainerStyle={styles.content} scroll>
      <AppHeader subtitle={subtitle ?? t.placeholder.subtitle} title={title} />
      <AppCard padding="lg" variant="default">
        <Stack gap="md">
          <AppBadge label={badge} variant="brand" />
          <AppText variant="title">{title}</AppText>
          <AppText color="secondary" variant="body">
            {description ?? t.placeholder.description}
          </AppText>
          <AppText color="muted" variant="caption">
            {t.placeholder.note}
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
