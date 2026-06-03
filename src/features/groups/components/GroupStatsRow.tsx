import { StyleSheet } from 'react-native';

import { AppBadge, Stack } from '../../../components';
import { getEntityLabel } from '../services';
import type { Group } from '../types';

type GroupStatsRowProps = {
  group: Group;
};

export function GroupStatsRow({ group }: GroupStatsRowProps) {
  const subject = getEntityLabel(group.subject);
  const academicYear = getEntityLabel(group.academic_year);
  const semester = getEntityLabel(group.semester);

  return (
    <Stack direction="horizontal" gap="sm" style={styles.row} wrap>
      {typeof group.members_count === 'number' ? (
        <AppBadge label={`الأعضاء ${group.members_count}`} variant="neutral" />
      ) : null}
      {subject ? <AppBadge label={`المادة ${subject}`} variant="brand" /> : null}
      {academicYear ? <AppBadge label={`السنة ${academicYear}`} variant="info" /> : null}
      {semester ? <AppBadge label={`الفصل ${semester}`} variant="neutral" /> : null}
    </Stack>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
  },
});
