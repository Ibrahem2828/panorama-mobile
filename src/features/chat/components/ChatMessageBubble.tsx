import { StyleSheet } from 'react-native';

import { AppCard, AppText, Stack } from '../../../components';
import { colors } from '../../../theme';
import {
  formatChatTimestamp,
  getChatMessageSenderName,
  getChatMessageText,
  isOwnChatMessage,
} from '../services';
import type { ChatMessage, Id } from '../types';

type ChatMessageBubbleProps = {
  message: ChatMessage;
  currentUserId?: Id | null;
};

export function ChatMessageBubble({ message, currentUserId }: ChatMessageBubbleProps) {
  const isOwn = isOwnChatMessage(message, currentUserId);
  const timestamp = formatChatTimestamp(message.created_at ?? message.updated_at);

  return (
    <Stack align={isOwn ? 'flex-start' : 'flex-end'}>
      <AppCard
        style={[styles.bubble, isOwn ? styles.ownBubble : styles.otherBubble]}
        variant="default"
      >
        <Stack gap="xs">
          {!isOwn ? (
            <AppText color="brand" variant="caption" weight="600">
              {getChatMessageSenderName(message)}
            </AppText>
          ) : null}
          <AppText color="secondary" variant="bodySmall">
            {getChatMessageText(message)}
          </AppText>
          {timestamp ? (
            <AppText align="left" color="muted" variant="caption">
              {timestamp}
            </AppText>
          ) : null}
        </Stack>
      </AppCard>
    </Stack>
  );
}

const styles = StyleSheet.create({
  bubble: {
    maxWidth: '86%',
    minHeight: 0,
  },
  ownBubble: {
    borderColor: colors.brand.primary,
    backgroundColor: colors.brand.primarySoft,
  },
  otherBubble: {
    borderColor: colors.border.default,
  },
});
