import { StyleSheet } from 'react-native';

import { AppBadge, Stack } from '../../../components';
import { useTranslation } from '../../../i18n';
import { getEntityLabel } from '../services';
import type { Group } from '../types';

type GroupStatsRowProps = {
  group: Group;
};

export function GroupStatsRow({ group }: GroupStatsRowProps) {
  const { t } = useTranslation();
  const subject = getEntityLabel(group.subject);
  const academicYear = getEntityLabel(group.academic_year);
  const semester = getEntityLabel(group.semester);

  return (
    <Stack direction="horizontal" gap="sm" style={styles.row} wrap>
      {typeof group.members_count === 'number' ? (
        <AppBadge label={t.groups.stats.members(group.members_count)} variant="neutral" />
      ) : null}
      {subject ? <AppBadge label={t.groups.stats.subject(subject)} variant="brand" /> : null}
      {academicYear ? (
        <AppBadge label={t.groups.stats.academicYear(academicYear)} variant="info" />
      ) : null}
      {semester ? <AppBadge label={t.groups.stats.semester(semester)} variant="neutral" /> : null}
    </Stack>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
  },
});
