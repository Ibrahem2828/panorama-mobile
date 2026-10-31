import { ScrollView, StyleSheet, View } from 'react-native';

import { AppBadge, AppText, AppTextInput, Chip, Stack } from '../../../components';
import { useTranslation } from '../../../i18n';
import { spacing } from '../../../theme';
import { formatYearName, sameId } from '../services';
import type { Id, SubjectLevel, TermFilter } from '../types';

const TERMS: readonly TermFilter[] = ['current', 'other', 'all'];

type SubjectFiltersProps = {
  /** Name of the semester the university is in now, when known. */
  currentTermName: string | null;
  term: TermFilter;
  onTermChange: (term: TermFilter) => void;
  years: readonly SubjectLevel[];
  academicYearId: Id | null;
  onYearChange: (academicYearId: Id | null) => void;
  search: string;
  onSearchChange: (value: string) => void;
};

/** Current-term chip, semester filter (current / other / all), year filter and the search box of the catalogue. */
export function SubjectFilters({
  currentTermName,
  term,
  onTermChange,
  years,
  academicYearId,
  onYearChange,
  search,
  onSearchChange,
}: SubjectFiltersProps) {
  const { t } = useTranslation();

  return (
    <Stack gap="md">
      {currentTermName ? (
        <View style={styles.termRow}>
          <AppBadge label={t.subjects.currentTermChip(currentTermName)} variant="brand" />
        </View>
      ) : null}

      <View style={styles.group}>
        <AppText color="muted" variant="caption" weight="600">
          {t.subjects.termFilterLabel}
        </AppText>
        <ScrollView
          contentContainerStyle={styles.row}
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          {TERMS.map((value) => (
            <Chip
              key={value}
              label={t.subjects.termFilters[value]}
              onPress={() => onTermChange(value)}
              selected={term === value}
            />
          ))}
        </ScrollView>
      </View>

      {years.length > 0 ? (
        <View style={styles.group}>
          <AppText color="muted" variant="caption" weight="600">
            {t.subjects.yearFilterLabel}
          </AppText>
          <ScrollView
            contentContainerStyle={styles.row}
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            <Chip
              label={t.subjects.allYears}
              onPress={() => onYearChange(null)}
              selected={academicYearId === null}
            />
            {years.map((year) => (
              <Chip
                key={String(year.id)}
                label={formatYearName(year.name, t.subjects)}
                onPress={() => onYearChange(year.id)}
                selected={sameId(academicYearId, year.id)}
              />
            ))}
          </ScrollView>
        </View>
      ) : null}

      <AppTextInput
        accessibilityLabel={t.subjects.searchLabel}
        autoCorrect={false}
        onChangeText={onSearchChange}
        placeholder={t.subjects.searchPlaceholder}
        returnKeyType="search"
        value={search}
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  termRow: { flexDirection: 'row' },
  group: { gap: spacing.xs },
  row: { gap: spacing.sm, paddingVertical: 2 },
});
