import { memo } from 'react';

import type { ArtworkTone, IconName } from '../../../components';
import { IconTile } from '../../../components';
import { useTranslation } from '../../../i18n';
import type { FileViewerType } from '../types';

type FileTypeIconProps = {
  type: FileViewerType;
  locked?: boolean;
  size?: 'sm' | 'md';
};

export function getFileTypeVisual(
  type: FileViewerType,
  locked: boolean,
): { icon: IconName; tone: ArtworkTone } {
  if (locked) {
    return { icon: 'lock', tone: 'warning' };
  }

  switch (type) {
    case 'pdf':
      return { icon: 'file', tone: 'error' };
    case 'image':
      return { icon: 'image', tone: 'info' };
    case 'document':
    case 'unknown':
      return { icon: 'file', tone: 'brand' };
  }
}

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
