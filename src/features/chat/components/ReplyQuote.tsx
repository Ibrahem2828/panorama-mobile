import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '../../../components';
import { useTranslation } from '../../../i18n';
import { colors, radius, spacing, useBrand } from '../../../theme';
import type { QuotedReply } from '../logic/reply';

type ReplyQuoteProps = {
  quote: QuotedReply;
  /** Tapping the quote jumps to the original message (omitted where it is not tappable, e.g. a pending bubble). */
  onPress?: (id: number) => void;
};

/** The quoted message shown inside a bubble: an accent stripe, the author and a one-line preview. */
export const ReplyQuote = memo(function ReplyQuote({ quote, onPress }: ReplyQuoteProps) {
  const { t } = useTranslation();
  const brand = useBrand();
  const body = (
    <>
      <View style={[styles.stripe, { backgroundColor: brand.primary }]} />
      <View style={styles.text}>
        {quote.deleted ? (
          <AppText color="muted" variant="caption">
            {t.chat.reply.deletedMessage}
          </AppText>
        ) : (
          <>
            <AppText color="brand" numberOfLines={1} variant="caption" weight="700">
              {quote.senderName}
            </AppText>
            {quote.preview ? (
              <AppText
                align="auto"
                color="secondary"
                numberOfLines={2}
                style={styles.preview}
                variant="caption"
              >
                {quote.preview}
              </AppText>
            ) : null}
          </>
        )}
      </View>
    </>
  );

  if (!onPress) {
    return <View style={styles.box}>{body}</View>;
  }

  return (
    <Pressable
      accessibilityHint={t.chat.reply.openOriginal}
      accessibilityLabel={
        quote.deleted
          ? t.chat.reply.deletedMessage
          : `${t.chat.reply.replyingTo(quote.senderName)}. ${quote.preview}`
      }
      accessibilityRole="button"
      onPress={() => onPress(quote.id)}
      style={({ pressed }) => [styles.box, pressed ? styles.pressed : null]}
    >
      {body}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.sm,
    paddingEnd: spacing.sm,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.background.muted,
  },
  stripe: {
    width: 4,
  },
  text: {
    flexShrink: 1,
    paddingVertical: spacing.xs,
    gap: 2,
  },
  preview: {
    writingDirection: 'auto',
  },
  pressed: {
    opacity: 0.7,
  },
});
