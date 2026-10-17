import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Icon } from '../../../components';
import { colors, spacing } from '../../../theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from '../../../i18n';
import type { ChatSendPermission } from '../types';

type ChatPermissionNoticeProps = {
  permission: ChatSendPermission;
  reason?: string;
};

/** Replaces the composer when this member may read but not send. */
export const ChatPermissionNotice = memo(function ChatPermissionNotice({
  permission,
  reason,
}: ChatPermissionNoticeProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const message =
    reason ??
    (permission === 'admins_only' ? t.chat.permission.adminsOnly : t.chat.permission.readOnly);

  return (
    <View
      accessibilityLiveRegion="polite"
      style={[styles.container, { paddingBottom: spacing.md + insets.bottom }]}
    >
      <Icon color={colors.text.secondary} name="lock" size={20} />
      <View style={styles.text}>
        <AppText variant="label" weight="700">
          {t.chat.permission.title}
        </AppText>
        <AppText color="secondary" variant="bodySmall">
          {message}
        </AppText>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.default,
    backgroundColor: colors.background.muted,
  },
  text: {
    flex: 1,
  },
});
