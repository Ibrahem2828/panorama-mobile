import { memo } from 'react';

import type { ArtworkKey } from '../../../components';
import { IconTile } from '../../../components';
import { useTranslation } from '../../../i18n';
import type { PrintOrderStatus } from '../types';

type PrintOrderStatusIconProps = {
  status: PrintOrderStatus;
  size?: 'sm' | 'md';
};

export function getPrintOrderStatusArtwork(status: PrintOrderStatus): ArtworkKey {
  switch (status) {
    case 'submitted':
    case 'pending':
    case 'accepted':
      return 'printingPending';
    case 'in_progress':
    case 'printing':
      return 'printingProcessing';
    case 'ready':
    case 'ready_for_pickup':
      return 'printingReady';
    case 'delivered':
      return 'printingCompleted';
    case 'cancelled':
    case 'canceled':
    case 'rejected':
      return 'printingCancelled';
    default:
      return 'printingPending';
  }
}

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
