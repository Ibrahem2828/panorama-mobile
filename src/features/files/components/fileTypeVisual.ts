import type { ArtworkTone, IconName } from '../../../components';
import type { FileViewerType } from '../types';

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
