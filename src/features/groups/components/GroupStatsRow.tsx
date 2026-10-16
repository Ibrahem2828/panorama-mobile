import { memo } from 'react';
import { StyleSheet } from 'react-native';

import { AppBadge, Stack } from '../../../components';
import { useTranslation } from '../../../i18n';
import type { Group, SubjectLabel } from '../types';

type GroupStatsRowProps = {
  group: Group;
  subject?: SubjectLabel | null;
};

function GroupStatsRowBase({ group, subject }: GroupStatsRowProps) {
  const { t } = useTranslation();

  return (
    <Stack direction="horizontal" gap="sm" style={styles.row} wrap>
      {typeof group.members_count === 'number' ? (
        <AppBadge label={t.groups.stats.members(group.members_count)} variant="neutral" />
      ) : null}
      {subject ? <AppBadge label={t.groups.stats.subject(subject.name)} variant="brand" /> : null}
      {subject?.code ? (
        <AppBadge label={t.groups.card.subjectCode(subject.code)} variant="neutral" />
      ) : null}
      {group.has_whatsapp_channel === true ? (
        <AppBadge label={t.groups.card.whatsAppAvailable} variant="success" />
      ) : null}
    </Stack>
  );
}

export const GroupStatsRow = memo(GroupStatsRowBase);

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
  },
});
