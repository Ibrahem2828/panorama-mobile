import { AppBadge } from '../../../components';
import { getSupportTicketStatusLabel, getSupportTicketStatusVariant } from '../services';
import type { SupportTicketStatus } from '../types';

type SupportTicketStatusBadgeProps = {
  status?: SupportTicketStatus;
};

export function SupportTicketStatusBadge({ status }: SupportTicketStatusBadgeProps) {
  return (
    <AppBadge
      label={getSupportTicketStatusLabel(status)}
      variant={getSupportTicketStatusVariant(status)}
    />
  );
}
