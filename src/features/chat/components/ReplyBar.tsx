import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppIconButton, AppText, Icon } from '../../../components';
import { useTranslation } from '../../../i18n';
import { colors, radius, spacing, useBrand } from '../../../theme';
import type { ChatReplyTarget } from '../types';

type ReplyBarProps = {
  target: ChatReplyTarget;
  onCancel: () => void;
};

/** Shown above the composer while a reply is being written: who is answered, a preview, and a cancel button. */
export const ReplyBar = memo(function ReplyBar({ target, onCancel }: ReplyBarProps) {
  const { t } = useTranslation();
  const brand = useBrand();

  return (
    <View style={styles.bar}>
      <View style={[styles.stripe, { backgroundColor: brand.primary }]} />
      <View style={styles.text}>
        <AppText color="brand" numberOfLines={1} variant="caption" weight="700">
          {t.chat.reply.replyingTo(target.senderName)}
        </AppText>
        {target.preview ? (
          <AppText align="auto" color="secondary" numberOfLines={1} variant="caption">
            {target.preview}
          </AppText>
        ) : null}
      </View>
      <AppIconButton
        accessibilityLabel={t.chat.reply.cancel}
        icon={<Icon color={colors.text.secondary} name="close" size={20} />}
        onPress={onCancel}
        size="sm"
      />
    </View>
  );
});

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingEnd: spacing.xs,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.background.muted,
  },
  stripe: {
    alignSelf: 'stretch',
    width: 4,
  },
  text: {
    flex: 1,
    paddingVertical: spacing.xs,
  },
});
