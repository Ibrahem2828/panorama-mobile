import { StyleSheet, View } from 'react-native';

import { AppText, Icon } from '../../../components';
import type { IconName } from '../../../components';
import { colors, radius, spacing } from '../../../theme';
import type { AcademicOption, ParsedStudentNumber } from '../types';
import { useTranslation } from '../../../i18n';

type StudentNumberPreviewCardProps = {
  parsedStudentNumber: ParsedStudentNumber | null;
};

type DetectedRow = {
  key: string;
  icon: IconName;
  label: string;
  value: string;
};

function valueToText(value: AcademicOption | string | number | null | undefined): string | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'string' || typeof value === 'number') return String(value);

  return value.name || null;
}

/** Only what a student cares about: university, faculty, year, semester, specialization. */
export function getDetectedRows(
  parsed: ParsedStudentNumber,
  labels: {
    university: string;
    faculty: string;
    academicYear: string;
    semester: string;
    major: string;
  },
): DetectedRow[] {
  const entries: [string, IconName, string, string | null][] = [
    ['university', 'building', labels.university, valueToText(parsed.university)],
    ['faculty', 'cap', labels.faculty, valueToText(parsed.faculty)],
    [
      'academicYear',
      'book',
      labels.academicYear,
      valueToText(parsed.academic_year ?? parsed.academicYear),
    ],
    ['semester', 'clock', labels.semester, valueToText(parsed.semester)],
    ['major', 'star', labels.major, valueToText(parsed.major)],
  ];

  return entries
    .filter((entry): entry is [string, IconName, string, string] => entry[3] !== null)
    .map(([key, icon, label, value]) => ({ key, icon, label, value }));
}

/** Result of reading the student number: a calm success card listing what was detected. */
export function StudentNumberPreviewCard({ parsedStudentNumber }: StudentNumberPreviewCardProps) {
  const { t } = useTranslation();

  if (!parsedStudentNumber) {
    return (
      <View style={styles.hint}>
        <Icon color={colors.text.muted} name="info" size={18} />
        <AppText color="secondary" style={styles.hintText} variant="bodySmall">
          {t.studentProfile.numberPreview.hint}
        </AppText>
      </View>
    );
  }

  const rows = getDetectedRows(parsedStudentNumber, t.studentProfile.numberPreview);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Icon color={colors.semantic.success} name="checkCircle" size={22} />
        <AppText style={styles.headerText} variant="subtitle" weight="600">
          {t.studentProfile.numberPreview.title}
        </AppText>
      </View>
      {rows.length === 0 ? (
        <AppText color="secondary" variant="bodySmall">
          {t.studentProfile.numberPreview.noDetails}
        </AppText>
      ) : (
        rows.map((row) => (
          <View key={row.key} style={styles.row}>
            <Icon color={colors.semantic.success} name={row.icon} size={18} />
            <AppText color="secondary" variant="bodySmall">
              {row.label}
            </AppText>
            <AppText numberOfLines={2} style={styles.value} variant="bodySmall" weight="600">
              {row.value}
            </AppText>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  hintText: {
    flex: 1,
  },
  card: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.semantic.successSoft,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerText: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 28,
  },
  value: {
    flex: 1,
  },
});
