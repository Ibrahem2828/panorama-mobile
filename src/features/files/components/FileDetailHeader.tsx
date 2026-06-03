import { AppBadge, AppCard, AppText, Stack } from '../../../components';
import {
  formatFileSize,
  getFileDisplayTitle,
  getFileExtension,
  getFileSize,
  getFileViewerType,
  getVisibilityLabel,
} from '../services';
import type { FileResource } from '../types';
import { FileTypeBadge } from './FileTypeBadge';

type FileDetailHeaderProps = {
  file: FileResource;
};

export function FileDetailHeader({ file }: FileDetailHeaderProps) {
  const title = getFileDisplayTitle(file);
  const extension = getFileExtension(file);
  const sizeLabel = formatFileSize(getFileSize(file));
  const visibilityLabel = getVisibilityLabel(file.visibility);

  return (
    <AppCard variant="elevated">
      <Stack gap="md">
        <Stack direction="horizontal" gap="md" wrap>
          <FileTypeBadge type={getFileViewerType(file)} />
          {extension ? <AppBadge label={extension.toUpperCase()} variant="neutral" /> : null}
          {sizeLabel ? <AppBadge label={sizeLabel} variant="brand" /> : null}
          {visibilityLabel ? <AppBadge label={visibilityLabel} variant="info" /> : null}
        </Stack>
        <Stack gap="xs">
          <AppText variant="h2">{title}</AppText>
          <AppText color="secondary" variant="bodySmall">
            يفتح هذا الملف داخل التطبيق فقط. لا يوجد زر تنزيل مباشر للطلاب.
          </AppText>
        </Stack>
      </Stack>
    </AppCard>
  );
}
