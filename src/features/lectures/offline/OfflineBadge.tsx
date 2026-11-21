import { memo } from 'react';

import { AppBadge } from '../../../components';
import { useTranslation } from '../../../i18n';
import type { OfflineKind } from './licenseLogic';
import { useOfflineItem } from './useOfflineItem';

/** Small «متاح بدون إنترنت» marker for a row (list card) whose copy is saved and still valid. Renders nothing otherwise. */
function OfflineBadgeBase({ id, kind }: { id: number | string; kind: OfflineKind }) {
  const { t } = useTranslation();
  const numeric = Number(id);
  const { state } = useOfflineItem(Number.isFinite(numeric) ? numeric : -1, kind);

  if (state.kind !== 'ready') {
    return null;
  }

  return <AppBadge label={t.offlineHome.badgeSaved} variant="success" />;
}

export const OfflineBadge = memo(OfflineBadgeBase);
