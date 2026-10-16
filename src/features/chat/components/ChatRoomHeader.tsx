import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppIconButton, AppText, Icon, Stack } from '../../../components';
import { colors, layout, spacing } from '../../../theme';
import { useTranslation } from '../../../i18n';
import { getIsRTL } from '../../../utils/rtl';
import { getGroupDisplayName } from '../../groups/services';
import type { Group } from '../../groups/types';
import type { ChatConnectionStatus } from '../types';
import { ChatConnectionStatusLine } from './ChatConnectionStatus';

type ChatRoomHeaderProps = {
  group: Group | null;
  connectionStatus: ChatConnectionStatus;
  isOnline: boolean;
  onBack: () => void;
};

export const ChatRoomHeader = memo(function ChatRoomHeader({
  group,
  connectionStatus,
  isOnline,
  onBack,
}: ChatRoomHeaderProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <AppIconButton
        accessibilityLabel={t.common.back}
        icon={
          <Icon color={colors.text.primary} name={getIsRTL() ? 'chevronRight' : 'chevronLeft'} />
        }
        onPress={onBack}
      />
      <View style={styles.titleBlock}>
        <AppText numberOfLines={1} variant="title">
          {group ? getGroupDisplayName(group, t.groups) : t.chat.title}
        </AppText>
        <Stack align="center" direction="horizontal" gap="md">
          <ChatConnectionStatusLine isOnline={isOnline} status={connectionStatus} />
          {group?.members_count !== undefined ? (
            <AppText color="muted" numberOfLines={1} variant="caption">
              {t.chat.membersCount(group.members_count)}
            </AppText>
          ) : null}
        </Stack>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    minHeight: layout.headerHeight - spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.default,
    backgroundColor: colors.background.surface,
  },
  titleBlock: {
    flex: 1,
    gap: spacing.xxs,
    alignItems: 'flex-start',
  },
});
