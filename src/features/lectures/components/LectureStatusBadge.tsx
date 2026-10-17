import { AppBadge } from '../../../components';
import { useTranslation } from '../../../i18n';
import { isKnownStatus } from '../logic';

type Props = { status: string };

export function statusVariant(status: string): 'success' | 'error' | 'warning' | 'info' {
  if (status === 'ready') return 'success';
  if (status === 'failed' || status === 'quarantined') return 'error';
  return status === 'uploaded' || status === 'queued' ? 'info' : 'warning';
}

export function LectureStatusBadge({ status }: Props) {
  const { t } = useTranslation();
  const label = isKnownStatus(status) ? t.lectures.status[status] : t.lectures.status.unknown;
  return <AppBadge label={label} variant={statusVariant(status)} />;
}
