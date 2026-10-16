import { ScrollView, StyleSheet, View } from 'react-native';

import { AppText, Chip } from '../../../components';
import { useTranslation } from '../../../i18n';
import { spacing } from '../../../theme';
import type { Id } from '../types';

type Option = { id: Id; name: string };

type SubjectLevelFilterProps = {
  years: Option[];
  semesters: Option[];
  academicYearId: Id | null;
  semesterId: Id | null;
  onChange: (filter: { academicYearId?: Id | null; semesterId?: Id | null }) => void;
};

function sameId(left: Id | null, right: Id) {
  return left !== null && String(left) === String(right);
}

/** Year + semester pills. "All" means no restriction, so students can open any level (retakes). */
export function SubjectLevelFilter({
  years,
  semesters,
  academicYearId,
  semesterId,
  onChange,
}: SubjectLevelFilterProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.wrapper}>
      <View style={styles.group}>
        <AppText color="muted" variant="caption" weight="600">
          {t.subjects.filters.year}
        </AppText>
        <ScrollView
          contentContainerStyle={styles.row}
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          <Chip
            label={t.subjects.filters.all}
            onPress={() => onChange({ academicYearId: null })}
            selected={academicYearId === null}
          />
          {years.map((year) => (
            <Chip
              key={String(year.id)}
              label={year.name}
              onPress={() => onChange({ academicYearId: year.id })}
              selected={sameId(academicYearId, year.id)}
            />
          ))}
        </ScrollView>
      </View>
      <View style={styles.group}>
        <AppText color="muted" variant="caption" weight="600">
          {t.subjects.filters.semester}
        </AppText>
        <ScrollView
          contentContainerStyle={styles.row}
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          <Chip
            label={t.subjects.filters.all}
            onPress={() => onChange({ semesterId: null })}
            selected={semesterId === null}
          />
          {semesters.map((semester) => (
            <Chip
              key={String(semester.id)}
              label={semester.name}
              onPress={() => onChange({ semesterId: semester.id })}
              selected={sameId(semesterId, semester.id)}
            />
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.md },
  group: { gap: spacing.xs },
  row: { gap: spacing.sm, paddingVertical: 2 },
});
