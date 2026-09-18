import { AppBadge, AppCard, AppText, Stack } from '../../../components';
import { useTranslation } from '../../../i18n';
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
  const { t } = useTranslation();
  const title = getFileDisplayTitle(file, t.files);
  const extension = getFileExtension(file);
  const sizeLabel = formatFileSize(getFileSize(file), t.files);
  const visibilityLabel = getVisibilityLabel(file.visibility, t.files);

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
            {t.files.details.inAppOnlyNote}
          </AppText>
        </Stack>
      </Stack>
    </AppCard>
  );
}
