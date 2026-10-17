import { memo } from 'react';

import { IconTile } from '../../../components';
import { useTranslation } from '../../../i18n';
import type { FileViewerType } from '../types';
import { getFileTypeVisual } from './fileTypeVisual';

type FileTypeIconProps = {
  type: FileViewerType;
  locked?: boolean;
  size?: 'sm' | 'md';
};

function FileTypeIconComponent({ type, locked = false, size = 'md' }: FileTypeIconProps) {
  const { t } = useTranslation();
  const visual = getFileTypeVisual(type, locked);

  return (
    <IconTile
      accessibilityLabel={t.files.type.iconAlt}
      icon={visual.icon}
      size={size === 'sm' ? 'sm' : 'md'}
      tone={visual.tone}
    />
  );
}

export const FileTypeIcon = memo(FileTypeIconComponent);
