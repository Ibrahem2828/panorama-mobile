import { StyleSheet } from 'react-native';

import { images } from '../../../assets/images';
import { AppCard, AppText, Illustration, Stack } from '../../../components';
import { spacing } from '../../../theme';

type FileViewerFallbackProps = {
  title?: string;
  message: string;
};

export function FileViewerFallback({
  title = 'لا يمكن عرض الملف',
  message,
}: FileViewerFallbackProps) {
  return (
    <AppCard style={styles.card} variant="muted">
      <Stack align="center" gap="sm">
        <Illustration
          accessibilityLabel="رسم يوضح تعذر معاينة الملف"
          size="lg"
          source={images.files.previewError}
        />
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
