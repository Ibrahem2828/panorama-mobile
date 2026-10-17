import type { ReactNode } from 'react';
import type { ImageSourcePropType } from 'react-native';
import { StyleSheet } from 'react-native';

import { colors, spacing } from '../../theme';
import { AppText } from '../common';
import { AppCard, Stack } from '../layout';
import { Artwork } from './Artwork';
import type { ArtworkKey } from './artworkCatalog';
import { Illustration } from './Illustration';

type StatusIllustrationCardProps = {
  artwork?: ArtworkKey;
  source?: ImageSourcePropType;
  accessibilityLabel: string;
  title: string;
  description: string;
  action?: ReactNode;
};

export function StatusIllustrationCard({
  artwork,
  source,
  accessibilityLabel,
  title,
  description,
  action,
}: StatusIllustrationCardProps) {
  return (
    <AppCard padding="lg" style={styles.card} variant="default">
      <Stack align="center" gap="md">
        {artwork ? (
          <Artwork name={artwork} size="md" />
        ) : source ? (
          <Illustration accessibilityLabel={accessibilityLabel} size="lg" source={source} />
        ) : null}
        <Stack gap="xs" style={styles.textBlock}>
          <AppText align="center" variant="title">
            {title}
          </AppText>
          <AppText align="center" color="secondary" variant="bodySmall">
            {description}
          </AppText>
        </Stack>
        {action}
      </Stack>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.surface,
  },
  textBlock: {
    width: '100%',
    paddingHorizontal: spacing.sm,
  },
});
