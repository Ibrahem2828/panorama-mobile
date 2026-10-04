import { Pressable, StyleSheet } from 'react-native';

import { AppBadge, AppCard, AppText, Stack } from '../../../components';
import { useTranslation } from '../../../i18n';
import { formatDateTime } from '../../../utils/formatDateTime';
import { opacity } from '../../../theme';
import {
  getSupportCategoryLabel,
  getSupportPriorityLabel,
  getSupportTicketPreview,
  getSupportTicketTitle,
} from '../services';
import type { SupportTicket } from '../types';
import { SupportTicketStatusBadge } from './SupportTicketStatusBadge';

type SupportTicketCardProps = {
  ticket: SupportTicket;
  onPress?: () => void;
};

export function SupportTicketCard({ ticket, onPress }: SupportTicketCardProps) {
  const { t, locale } = useTranslation();
  const preview = getSupportTicketPreview(ticket);
  const date = formatDateTime(ticket.created_at ?? ticket.updated_at, locale);

  return (
    <Pressable
      accessibilityRole="button"
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [pressed && onPress ? styles.pressed : null]}
    >
      <AppCard variant="elevated">
        <Stack gap="md">
          <Stack direction="horizontal" gap="md" style={styles.header}>
            <Stack gap="xs" style={styles.titleBlock}>
              <AppText numberOfLines={2} variant="title">
                {getSupportTicketTitle(ticket, t.support)}
              </AppText>
              {preview ? (
                <AppText color="secondary" numberOfLines={2} variant="bodySmall">
                  {preview}
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
            {date ? <AppBadge label={date} variant="neutral" /> : null}
          </Stack>
        </Stack>
      </AppCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: opacity.pressed,
  },
  header: {
    alignItems: 'flex-start',
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
  },
});
