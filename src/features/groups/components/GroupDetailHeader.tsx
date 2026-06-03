import { StyleSheet } from 'react-native';

import { AppAvatar, AppCard, AppText, Stack } from '../../../components';
import { getGroupDescription, getGroupDisplayName, getGroupImageUri } from '../services';
import type { Group } from '../types';
import { GroupMembershipBadge } from './GroupMembershipBadge';
import { GroupStatsRow } from './GroupStatsRow';

type GroupDetailHeaderProps = {
  group: Group;
};

export function GroupDetailHeader({ group }: GroupDetailHeaderProps) {
  const title = getGroupDisplayName(group);
  const description = getGroupDescription(group);
  const imageUri = getGroupImageUri(group) ?? undefined;

  return (
    <AppCard variant="elevated">
      <Stack gap="lg">
        <Stack direction="horizontal" gap="md" style={styles.header}>
          <AppAvatar imageUri={imageUri} name={title} size="lg" />
          <Stack gap="sm" style={styles.titleBlock}>
            <AppText variant="h2">{title}</AppText>
            <GroupMembershipBadge status={group.current_user_membership_status} />
          </Stack>
        </Stack>

        {description ? (
          <AppText color="secondary" variant="bodySmall">
            {description}
          </AppText>
        ) : null}

        <GroupStatsRow group={group} />
      </Stack>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
  },
});
