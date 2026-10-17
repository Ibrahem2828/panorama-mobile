import { memo } from 'react';

import type { ArtworkKey } from '../../../components';
import { IconTile } from '../../../components';
import { useTranslation } from '../../../i18n';
import type { PrintOrderStatus } from '../types';
import { getPrintOrderStatusArtwork } from './printOrderStatusArtwork';

type PrintOrderStatusIconProps = {
  status: PrintOrderStatus;
  size?: 'sm' | 'md';
};

function PrintOrderStatusIconComponent({ status, size = 'sm' }: PrintOrderStatusIconProps) {
  const { t } = useTranslation();
  const artwork = getPrintOrderStatusArtwork(status);

  const visual = getVisual(artwork);
  return (
    <IconTile
      accessibilityLabel={t.printing.details.statusIconAlt}
      icon={visual.icon}
      size={size === 'md' ? 'lg' : 'md'}
      tone={visual.tone}
    />
  );
}

function getVisual(artwork: ArtworkKey) {
  switch (artwork) {
    case 'printingProcessing':
      return { icon: 'printer', tone: 'info' } as const;
    case 'printingReady':
    case 'printingCompleted':
      return { icon: 'check', tone: 'success' } as const;
    case 'printingCancelled':
      return { icon: 'close', tone: 'error' } as const;
    default:
      return { icon: 'clock', tone: 'warning' } as const;
  }
}

export const PrintOrderStatusIcon = memo(PrintOrderStatusIconComponent);
