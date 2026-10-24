import { memo, useCallback } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppAvatar, AppButton, AppCard, AppText, Stack } from '../../../components';
import { useTranslation } from '../../../i18n';
import { colors, opacity, radius, spacing, useBrand } from '../../../theme';
import { useChatUnreadStore } from '../../chat/store/unreadStore';
import { getGroupDisplayName, getGroupImageUri, resolveMembershipState } from '../services';
import type { Group, Id, SubjectLabel } from '../types';
import { GroupMembershipBadge } from './GroupMembershipBadge';
import { GroupStatsRow } from './GroupStatsRow';
import { isolateLtr } from '../../../utils/rtl';

type GroupCardProps = {
  group: Group;
  subject?: SubjectLabel | null;
  /** In-flight join/leave for this group (disables the quick action). */
  pendingAction?: 'join' | 'leave';
  onPress?: (group: Group) => void;
  /** When set, groups the student can still join show a quick "request to join" button. */
  onJoin?: (groupId: Id) => void;
};

function GroupCardBase({ group, subject, pendingAction, onPress, onJoin }: GroupCardProps) {
  const { t } = useTranslation();
  const brand = useBrand();
  const unread = useChatUnreadStore((state) => state.byGroup[String(group.id)] ?? 0);
  const title = getGroupDisplayName(group, t.groups);
  const imageUri = getGroupImageUri(group) ?? undefined;
  const membership = resolveMembershipState(group);
  const handlePress = useCallback(() => onPress?.(group), [onPress, group]);
  const handleJoin = useCallback(() => onJoin?.(group.id), [onJoin, group.id]);
  // The subject name is shown on its own line only when it adds something to the group name.
  const subjectLine =
    subject && subject.name !== title
      ? [subject.name, subject.code ? isolateLtr(subject.code) : null].filter(Boolean).join(' · ')
      : subject?.code
        ? isolateLtr(subject.code)
        : null;

  return (
    <AppCard variant="elevated">
      <Pressable
        accessibilityLabel={t.groups.card.openGroup(title)}
        accessibilityRole="button"
        android_ripple={{ color: colors.ripple, foreground: true }}
        disabled={!onPress}
        onPress={handlePress}
        style={({ pressed }) => [pressed ? styles.pressed : null]}
      >
        <Stack gap="md">
          <Stack direction="horizontal" gap="md" style={styles.header}>
            <AppAvatar icon="users" imageUri={imageUri} name={title} size="md" />
            <Stack gap="xs" style={styles.titleBlock}>
              <AppText numberOfLines={2} variant="title">
                {title}
              </AppText>
              {subjectLine ? (
                <AppText color="secondary" numberOfLines={1} variant="bodySmall">
                  {subjectLine}
                </AppText>
              ) : null}
            </Stack>
            {unread > 0 ? (
              <View
                accessibilityLabel={t.chat.unreadBadge(unread)}
                style={[styles.unreadBadge, { backgroundColor: brand.primary }]}
              >
                <AppText color="inverse" variant="caption" weight="700">
                  {t.chat.unreadBadge(unread)}
                </AppText>
              </View>
            ) : null}
            <GroupMembershipBadge status={group.current_user_membership_status} />
          </Stack>

          <GroupStatsRow group={group} />
        </Stack>
      </Pressable>

      {onJoin && membership.canRequestJoin ? (
        <AppButton
          fullWidth
          loading={pendingAction === 'join'}
          onPress={handleJoin}
          size="sm"
          style={styles.joinButton}
          title={t.groups.card.joinShort}
          variant="outline"
        />
      ) : null}
    </AppCard>
  );
}

export const GroupCard = memo(GroupCardBase);

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
  unreadBadge: {
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
    borderRadius: radius.full,
  },
  joinButton: {
    marginTop: 12,
  },
});
