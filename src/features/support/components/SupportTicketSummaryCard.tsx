import { AppBadge, AppCard, AppText, Stack } from '../../../components';
import { useTranslation } from '../../../i18n';
import { formatDateTime } from '../../../utils/formatDateTime';
import {
  getSupportCategoryLabel,
  getSupportPriorityLabel,
  getSupportTicketPreview,
  getSupportTicketTitle,
} from '../services';
import type { SupportTicket } from '../types';
import { SupportTicketStatusBadge } from './SupportTicketStatusBadge';

type SupportTicketSummaryCardProps = {
  ticket: SupportTicket;
};

export function SupportTicketSummaryCard({ ticket }: SupportTicketSummaryCardProps) {
  const { t, locale } = useTranslation();
  const preview = getSupportTicketPreview(ticket);
  const createdAt = formatDateTime(ticket.created_at, locale);

  return (
    <AppCard variant="outlined">
      <Stack gap="md">
        <Stack direction="horizontal" gap="md" wrap>
          <Stack gap="xs" style={{ flex: 1, minWidth: 0 }}>
            <AppText variant="title">{getSupportTicketTitle(ticket, t.support)}</AppText>
            {createdAt ? (
              <AppText color="muted" variant="caption">
                {createdAt}
              </AppText>
            ) : null}
          </Stack>
          <SupportTicketStatusBadge status={ticket.status} />
        </Stack>

        <Stack direction="horizontal" gap="sm" wrap>
          <AppBadge label={getSupportCategoryLabel(ticket.category, t.support)} variant="info" />
          {ticket.priority ? (
            <AppBadge
              label={getSupportPriorityLabel(ticket.priority, t.support)}
              variant="warning"
            />
          ) : null}
        </Stack>

        {preview ? (
          <Stack gap="xs">
            <AppText variant="bodySmall" weight="600">
              {t.support.details.primaryMessage}
            </AppText>
            <AppText color="secondary" variant="bodySmall">
              {preview}
            </AppText>
          </Stack>
        ) : null}
      </Stack>
    </AppCard>
  );
}
