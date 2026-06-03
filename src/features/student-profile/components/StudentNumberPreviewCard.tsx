import { StyleSheet, View } from 'react-native';

import { AppCard, AppText, Stack } from '../../../components';
import { colors, spacing } from '../../../theme';
import type { AcademicOption, ParsedStudentNumber } from '../types';

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

function getPreviewRows(parsedStudentNumber: ParsedStudentNumber): PreviewRow[] {
  return [
    toRow('الرقم الجامعي', parsedStudentNumber.student_number ?? parsedStudentNumber.studentNumber),
    toRow('رمز الجامعة', parsedStudentNumber.university_code ?? parsedStudentNumber.universityCode),
    toRow('رمز الكلية', parsedStudentNumber.faculty_code ?? parsedStudentNumber.facultyCode),
    toRow('رمز السنة', parsedStudentNumber.year_code ?? parsedStudentNumber.yearCode),
    toRow(
      'الرقم التسلسلي',
      parsedStudentNumber.sequence_number ?? parsedStudentNumber.sequenceNumber,
    ),
    toRow('الجامعة', valueToText(parsedStudentNumber.university)),
    toRow('الكلية', valueToText(parsedStudentNumber.faculty)),
    toRow(
      'السنة الأكاديمية',
      valueToText(parsedStudentNumber.academic_year ?? parsedStudentNumber.academicYear),
    ),
    toRow('الفصل', valueToText(parsedStudentNumber.semester)),
    toRow('الاختصاص', valueToText(parsedStudentNumber.major)),
  ].filter((row): row is PreviewRow => row !== null);
}

export function StudentNumberPreviewCard({ parsedStudentNumber }: StudentNumberPreviewCardProps) {
  if (!parsedStudentNumber) {
    return (
      <AppCard padding="md" variant="muted">
        <AppText align="center" color="secondary" variant="bodySmall">
          أدخل الرقم الجامعي ثم اضغط تحليل الرقم لعرض القراءة المتوقعة قبل الحفظ.
        </AppText>
      </AppCard>
    );
  }

  const rows = getPreviewRows(parsedStudentNumber);

  return (
    <AppCard padding="md" variant="outlined">
      <Stack gap="md">
        <AppText variant="title">معاينة الرقم الجامعي</AppText>
        {rows.length === 0 ? (
          <AppText color="secondary" variant="bodySmall">
            تم تحليل الرقم، لكن لم يرجع الخادم تفاصيل إضافية.
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
