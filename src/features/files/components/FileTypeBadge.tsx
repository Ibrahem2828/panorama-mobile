import { AppBadge } from '../../../components';
import type { FileViewerType } from '../types';

type FileTypeBadgeProps = {
  type: FileViewerType;
};

function getTypeLabel(type: FileViewerType): string {
  switch (type) {
    case 'pdf':
      return 'PDF';
    case 'image':
      return 'صورة';
    case 'document':
      return 'مستند';
    case 'unknown':
      return 'ملف';
  }
}

export function FileTypeBadge({ type }: FileTypeBadgeProps) {
  return <AppBadge label={getTypeLabel(type)} variant={type === 'unknown' ? 'neutral' : 'info'} />;
}
