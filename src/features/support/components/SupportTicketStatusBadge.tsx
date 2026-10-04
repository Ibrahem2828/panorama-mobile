import { AppBadge } from '../../../components';
import { useTranslation } from '../../../i18n';
import { getSupportTicketStatusLabel, getSupportTicketStatusVariant } from '../services';
import type { SupportTicketStatus } from '../types';

type SupportTicketStatusBadgeProps = {
  status?: SupportTicketStatus;
};

export function SupportTicketStatusBadge({ status }: SupportTicketStatusBadgeProps) {
  const { t } = useTranslation();

  return (
    <AppBadge
      label={getSupportTicketStatusLabel(status, t.support, t.common.unknown)}
      variant={getSupportTicketStatusVariant(status)}
    />
  );
}
