import { StyleSheet } from 'react-native';

import { AppCard, AppText, Stack } from '../../../components';
import { colors } from '../../../theme';
import { formatSupportDate, getSupportMessageText, isSupportStaffMessage } from '../services';
import type { SupportTicketMessage } from '../types';

type SupportMessageBubbleProps = {
  message: SupportTicketMessage;
};

export function SupportMessageBubble({ message }: SupportMessageBubbleProps) {
  const isStaff = isSupportStaffMessage(message);
  const date = formatSupportDate(message.created_at ?? message.updated_at);

  return (
    <AppCard style={isStaff ? styles.staffCard : styles.userCard} variant="default">
      <Stack gap="xs">
        <AppText color={isStaff ? 'brand' : 'primary'} variant="caption" weight="600">
          {isStaff ? 'فريق الدعم' : (message.sender_name ?? 'أنت')}
        </AppText>
        <AppText color="secondary" variant="bodySmall">
          {getSupportMessageText(message)}
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
