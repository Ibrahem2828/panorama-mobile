import { StyleSheet } from 'react-native';

import { AppCard, AppText, Artwork, Stack } from '../../../components';
import { spacing } from '../../../theme';

type FileViewerFallbackProps = {
  title?: string;
  message: string;
};

export function FileViewerFallback({ title, message }: FileViewerFallbackProps) {
  return (
    <AppCard style={styles.card} variant="muted">
      <Stack align="center" gap="sm">
        <Artwork name="previewError" size="md" />
        <AppText align="center" variant="title">
          {title}
        </AppText>
        <AppText align="center" color="secondary" variant="bodySmall">
          {message}
        </AppText>
      </Stack>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    justifyContent: 'center',
    minHeight: 240,
    paddingVertical: spacing.xxl,
  },
});
