import { Pressable, StyleSheet } from 'react-native';

import { AppBadge, AppCard, AppText, Stack } from '../../../components';
import { opacity } from '../../../theme';
import {
  formatFileSize,
  getFileDescription,
  getFileDisplayTitle,
  getFileExtension,
  getFileSize,
  getFileUpdatedAt,
  getFileViewerType,
} from '../services';
import type { FileResource } from '../types';
import { FileTypeBadge } from './FileTypeBadge';

type FileCardProps = {
  file: FileResource;
  onPress?: () => void;
};

function formatDate(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleDateString('ar-SY');
}

export function FileCard({ file, onPress }: FileCardProps) {
  const title = getFileDisplayTitle(file);
  const description = getFileDescription(file);
  const extension = getFileExtension(file);
  const viewerType = getFileViewerType(file);
  const sizeLabel = formatFileSize(getFileSize(file));
  const updatedAt = formatDate(getFileUpdatedAt(file));

  return (
    <Pressable
      accessibilityRole="button"
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [pressed && onPress ? styles.pressed : null]}
    >
      <AppCard variant="elevated">
        <Stack gap="md">
          <Stack direction="horizontal" gap="md" style={styles.header}>
            <Stack gap="xs" style={styles.titleBlock}>
              <AppText variant="title">{title}</AppText>
              {description ? (
                <AppText color="secondary" numberOfLines={2} variant="bodySmall">
                  {description}
                </AppText>
              ) : null}
            </Stack>
            <FileTypeBadge type={viewerType} />
          </Stack>

          <Stack direction="horizontal" gap="sm" wrap>
            {extension ? <AppBadge label={extension.toUpperCase()} variant="neutral" /> : null}
            {sizeLabel ? <AppBadge label={sizeLabel} variant="brand" /> : null}
            {updatedAt ? <AppBadge label={updatedAt} variant="neutral" /> : null}
          </Stack>
        </Stack>
      </AppCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
  },
  pressed: {
    opacity: opacity.pressed,
  },
});
