import { useRef } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';

import { AppAvatar, AppBadge, AppCard, AppText, Stack } from '../../../components';
import { useTranslation, type TranslationCatalog } from '../../../i18n';
import { opacity } from '../../../theme';
import { createPressScaleAnim } from '../../../utils/motion';
import { getGroupDescription, getGroupDisplayName, getGroupImageUri } from '../services';
import type { Group } from '../types';
import { GroupMembershipBadge } from './GroupMembershipBadge';
import { GroupStatsRow } from './GroupStatsRow';

type GroupCardProps = {
  group: Group;
  onPress?: () => void;
};

function getSendPermissionLabel(
  permission: Group['send_messages_permission'],
  t: TranslationCatalog['groups']['permissions'],
) {
  if (permission === 'all_members') {
    return t.sendToAll;
  }

  if (permission === 'admins_only') {
    return t.sendToAdmins;
  }

  return permission ? t.sendPermission : null;
}

export function GroupCard({ group, onPress }: GroupCardProps) {
  const { t } = useTranslation();
  const title = getGroupDisplayName(group, t.groups);
  const description = getGroupDescription(group);
  const imageUri = getGroupImageUri(group) ?? undefined;
  const sendPermissionLabel = getSendPermissionLabel(
    group.send_messages_permission,
    t.groups.permissions,
  );
  const hasWhatsAppLink = group.has_whatsapp_channel === true;

  const { scale, onPressIn, onPressOut } = useRef(createPressScaleAnim()).current;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={!onPress}
      onPress={onPress}
      onPressIn={onPress ? onPressIn : undefined}
      onPressOut={onPress ? onPressOut : undefined}
      style={({ pressed }) => [pressed && onPress ? styles.pressed : null]}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <AppCard variant="elevated">
          <Stack gap="md">
            <Stack direction="horizontal" gap="md" style={styles.header}>
              <AppAvatar imageUri={imageUri} name={title} size="md" />
              <Stack gap="xs" style={styles.titleBlock}>
                <AppText variant="title">{title}</AppText>
                {description ? (
                  <AppText color="secondary" numberOfLines={2} variant="bodySmall">
                    {description}
                  </AppText>
                ) : null}
              </Stack>
              <GroupMembershipBadge status={group.current_user_membership_status} />
            </Stack>

            <GroupStatsRow group={group} />

            <Stack direction="horizontal" gap="sm" wrap>
              {sendPermissionLabel ? <AppBadge label={sendPermissionLabel} variant="info" /> : null}
              {group.current_user_group_role ? (
                <AppBadge
                  label={t.groups.stats.role(group.current_user_group_role)}
                  variant="neutral"
                />
              ) : null}
              {hasWhatsAppLink ? (
                <AppBadge label={t.groups.stats.whatsApp} variant="success" />
              ) : null}
            </Stack>
          </Stack>
        </AppCard>
      </Animated.View>
    </Pressable>
  );
}

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
