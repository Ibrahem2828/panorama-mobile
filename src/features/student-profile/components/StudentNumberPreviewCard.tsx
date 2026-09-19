import { StyleSheet, View } from 'react-native';

import { AppCard, AppText, Stack } from '../../../components';
import { colors, spacing } from '../../../theme';
import type { AcademicOption, ParsedStudentNumber } from '../types';
import { useTranslation, type TranslationCatalog } from '../../../i18n';

type StudentNumberPreviewCardProps = {
  parsedStudentNumber: ParsedStudentNumber | null;
};

type PreviewRow = {
  label: string;
  value: string;
};

function valueToText(value: AcademicOption | string | number | null | undefined): string | null {
  if (!value) {
    return null;
  }

  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }

  return value.name;
}

function toRow(label: string, value: string | number | null | undefined): PreviewRow | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  return {
    label,
    value: String(value),
  };
}

function getPreviewRows(
  parsedStudentNumber: ParsedStudentNumber,
  t: TranslationCatalog,
): PreviewRow[] {
  return [
    toRow(
      t.studentProfile.numberPreview.studentNumber,
      parsedStudentNumber.student_number ?? parsedStudentNumber.studentNumber,
    ),
    toRow(
      t.studentProfile.numberPreview.universityCode,
      parsedStudentNumber.university_code ?? parsedStudentNumber.universityCode,
    ),
    toRow(
      t.studentProfile.numberPreview.facultyCode,
      parsedStudentNumber.faculty_code ?? parsedStudentNumber.facultyCode,
    ),
    toRow(
      t.studentProfile.numberPreview.yearCode,
      parsedStudentNumber.year_code ?? parsedStudentNumber.yearCode,
    ),
    toRow(
      t.studentProfile.numberPreview.serial,
      parsedStudentNumber.sequence_number ?? parsedStudentNumber.sequenceNumber,
    ),
    toRow(t.studentProfile.numberPreview.university, valueToText(parsedStudentNumber.university)),
    toRow(t.studentProfile.numberPreview.faculty, valueToText(parsedStudentNumber.faculty)),
    toRow(
      t.studentProfile.numberPreview.academicYear,
      valueToText(parsedStudentNumber.academic_year ?? parsedStudentNumber.academicYear),
    ),
    toRow(t.studentProfile.numberPreview.semester, valueToText(parsedStudentNumber.semester)),
    toRow(t.studentProfile.numberPreview.major, valueToText(parsedStudentNumber.major)),
  ].filter((row): row is PreviewRow => row !== null);
}

export function StudentNumberPreviewCard({ parsedStudentNumber }: StudentNumberPreviewCardProps) {
  const { t } = useTranslation();
  if (!parsedStudentNumber) {
    return (
      <AppCard padding="md" variant="muted">
        <AppText align="center" color="secondary" variant="bodySmall">
          {t.studentProfile.numberPreview.hint}
        </AppText>
      </AppCard>
    );
  }

  const rows = getPreviewRows(parsedStudentNumber, t);

  return (
    <AppCard padding="md" variant="outlined">
      <Stack gap="md">
        <AppText variant="title">{t.studentProfile.numberPreview.title}</AppText>
        {rows.length === 0 ? (
          <AppText color="secondary" variant="bodySmall">
            {t.studentProfile.numberPreview.noDetails}
          </AppText>
        ) : (
          <Stack gap="sm">
            {rows.map((row) => (
              <View key={row.label} style={styles.row}>
                <AppText color="secondary" variant="bodySmall">
                  {row.label}
                </AppText>
                <AppText style={styles.valueText} variant="bodySmall" weight="600">
                  {row.value}
                </AppText>
              </View>
            ))}
          </Stack>
        )}
      </Stack>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.default,
  },
  valueText: {
    flex: 1,
  },
});
