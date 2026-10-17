import { memo, useCallback } from 'react';
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
  onPress?: (ticket: SupportTicket) => void;
};

function SupportTicketCardComponent({ ticket, onPress }: SupportTicketCardProps) {
  const { t, locale } = useTranslation();
  const preview = getSupportTicketPreview(ticket);
  const date = formatDateTime(ticket.created_at ?? ticket.updated_at, locale);
  const handlePress = useCallback(() => onPress?.(ticket), [onPress, ticket]);

  return (
    <Pressable
      accessibilityRole="button"
      android_ripple={{ color: 'rgba(16, 24, 40, 0.08)', foreground: true }}
      disabled={!onPress}
      onPress={handlePress}
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

export const SupportTicketCard = memo(SupportTicketCardComponent);

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
