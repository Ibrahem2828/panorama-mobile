import { StyleSheet } from 'react-native';

import { AppCard, AppText, Stack } from '../../../components';
import { useTranslation } from '../../../i18n';
import { formatDateTime } from '../../../utils/formatDateTime';
import { colors } from '../../../theme';
import { getSupportMessageText, isSupportStaffMessage } from '../services';
import type { SupportTicketMessage } from '../types';

type SupportMessageBubbleProps = {
  message: SupportTicketMessage;
};

export function SupportMessageBubble({ message }: SupportMessageBubbleProps) {
  const { t, locale } = useTranslation();
  const isStaff = isSupportStaffMessage(message);
  const date = formatDateTime(message.created_at ?? message.updated_at, locale);

  return (
    <AppCard style={isStaff ? styles.staffCard : styles.userCard} variant="default">
      <Stack gap="xs">
        <AppText color={isStaff ? 'brand' : 'primary'} variant="caption" weight="600">
          {isStaff
            ? t.support.details.staffSender
            : (message.sender_name ?? t.support.details.selfSender)}
        </AppText>
        <AppText color="secondary" variant="bodySmall">
          {getSupportMessageText(message, t.support)}
        </AppText>
        {date ? (
          <AppText color="muted" variant="caption">
            {date}
          </AppText>
        ) : null}
      </Stack>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  staffCard: {
    borderColor: colors.brand.primary,
  },
  userCard: {
    borderColor: colors.border.default,
  },
});
