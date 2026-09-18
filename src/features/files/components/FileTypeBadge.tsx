import { AppBadge } from '../../../components';
import { useTranslation, type TranslationCatalog } from '../../../i18n';
import type { FileViewerType } from '../types';

type FileTypeBadgeProps = {
  type: FileViewerType;
};

function getTypeLabel(type: FileViewerType, t: TranslationCatalog): string {
  switch (type) {
    case 'pdf':
      return 'PDF';
    case 'image':
      return t.files.type.image;
    case 'document':
      return t.files.type.document;
    case 'unknown':
      return t.files.type.file;
  }
}

export function FileTypeBadge({ type }: FileTypeBadgeProps) {
  const { t } = useTranslation();

  return (
    <AppBadge label={getTypeLabel(type, t)} variant={type === 'unknown' ? 'neutral' : 'info'} />
  );
}
