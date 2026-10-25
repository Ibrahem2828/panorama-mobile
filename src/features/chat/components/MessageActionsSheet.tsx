import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Icon } from '../../../components';
import { AppModal } from '../../../components/overlay';
import { useTranslation } from '../../../i18n';
import { colors, radius, shadows, spacing, useBrand } from '../../../theme';
import { REACTION_EMOJIS, type ChatMessage } from '../types';

type MessageActionsSheetProps = {
  message: ChatMessage | null;
  canDelete: boolean;
  onReact: (message: ChatMessage, emoji: string | null) => void;
  onDelete: (message: ChatMessage) => void;
  onClose: () => void;
};

/** Long-press menu of one message: the six reactions (tap again to remove yours) and, when allowed, delete. */
export const MessageActionsSheet = memo(function MessageActionsSheet({
  message,
  canDelete,
  onReact,
  onDelete,
  onClose,
}: MessageActionsSheetProps) {
  const { t } = useTranslation();
  const brand = useBrand();

  return (
    <AppModal animationType="fade" onRequestClose={onClose} transparent visible={message !== null}>
      <Pressable
        accessibilityLabel={t.chat.actions.close}
        accessibilityRole="button"
        onPress={onClose}
        style={styles.backdrop}
      >
        {message ? (
          <Pressable accessible={false} style={styles.sheet}>
            <AppText align="center" color="muted" variant="caption">
              {t.chat.reactions.title}
            </AppText>
            <View style={styles.reactionRow}>
              {REACTION_EMOJIS.map((emoji) => {
                const selected = message.my_reaction === emoji;

                return (
                  <Pressable
                    accessibilityLabel={selected ? `${emoji} — ${t.chat.reactions.remove}` : emoji}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    key={emoji}
                    onPress={() => {
                      onReact(message, selected ? null : emoji);
                      onClose();
                    }}
                    style={[
                      styles.emojiButton,
                      selected
                        ? { backgroundColor: brand.primarySoft, borderColor: brand.primary }
                        : null,
                    ]}
                  >
                    <AppText align="center" style={styles.emoji}>
                      {emoji}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>

            {canDelete ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  onDelete(message);
                  onClose();
                }}
                style={styles.action}
              >
                <Icon color={colors.semantic.error} name="trash" size={20} />
                <AppText color="error" variant="label" weight="600">
                  {t.chat.actions.delete}
                </AppText>
              </Pressable>
            ) : null}
          </Pressable>
        ) : null}
      </Pressable>
    </AppModal>
  );
});

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: 'rgba(16, 24, 40, 0.45)',
  },
  sheet: {
    width: '100%',
    maxWidth: 420,
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.background.surface,
    ...shadows.md,
  },
  reactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  emojiButton: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  emoji: {
    fontSize: 26,
    lineHeight: 34,
  },
  action: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.default,
    paddingTop: spacing.sm,
  },
});
