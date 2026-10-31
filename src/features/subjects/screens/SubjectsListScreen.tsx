import { useCallback, useEffect, useMemo } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SectionList, StyleSheet, View } from 'react-native';

import {
  AppBadge,
  AppButton,
  AppHeader,
  AppScreen,
  AppText,
  BrandRefreshControl,
  EmptyState,
  ErrorState,
  SkeletonList,
  Stack,
} from '../../../components';
import { useTranslation } from '../../../i18n';
import { SubjectsRoutes } from '../../../navigation/routes';
import type { SubjectsStackParamList } from '../../../navigation/types';
import { useNetworkStore } from '../../../offline/networkStore';
import { spacing } from '../../../theme';
import { formatTime } from '../../../utils/formatDateTime';
import { useTermStore } from '../../academic-term/termStore';
import { SubjectCard, SubjectFilters } from '../components';
import {
  buildSemesterSections,
  collectYears,
  filterSubjects,
  formatSemesterName,
} from '../services';
import { useSubjectsStore } from '../store';
import type { CatalogSubject, SubjectSection } from '../types';

type SubjectsListScreenProps = NativeStackScreenProps<SubjectsStackParamList, 'SubjectsList'>;

/**
 * The read-only subject catalogue: every subject of the student's faculty, grouped by semester with the current term
 * first. There is no join or registration action here; a card only opens the subject's details.
 */
export function SubjectsListScreen({ navigation }: SubjectsListScreenProps) {
  const { t, locale } = useTranslation();
  const subjects = useSubjectsStore((state) => state.subjects);
  const search = useSubjectsStore((state) => state.search);
  const term = useSubjectsStore((state) => state.term);
  const academicYearId = useSubjectsStore((state) => state.academicYearId);
  const isLoading = useSubjectsStore((state) => state.isLoading);
  const isRefreshing = useSubjectsStore((state) => state.isRefreshing);
  const errorMessage = useSubjectsStore((state) => state.errorMessage);
  const lastLoadedAt = useSubjectsStore((state) => state.lastLoadedAt);
  const loadSubjects = useSubjectsStore((state) => state.loadSubjects);
  const refreshSubjects = useSubjectsStore((state) => state.refreshSubjects);
  const setSearch = useSubjectsStore((state) => state.setSearch);
  const setTerm = useSubjectsStore((state) => state.setTerm);
  const setAcademicYear = useSubjectsStore((state) => state.setAcademicYear);
  const currentTerm = useTermStore((state) => state.currentTerm);
  const isOnline = useNetworkStore((state) => state.isOnline);

  const years = useMemo(() => collectYears(subjects), [subjects]);
  const sections = useMemo(
    () =>
      buildSemesterSections(
        filterSubjects(subjects, { term, academicYearId, search }),
        currentTerm?.semester.id ?? null,
      ),
    [subjects, term, academicYearId, search, currentTerm],
  );
  const hasActiveFilter = term !== 'all' || academicYearId !== null || search.trim().length > 0;
  const showInitialLoading = isLoading && !lastLoadedAt;
  const showInitialError = Boolean(errorMessage && !lastLoadedAt);

  useEffect(() => {
    void loadSubjects();
  }, [loadSubjects]);

  const handleRefresh = useCallback(() => {
    void refreshSubjects();
  }, [refreshSubjects]);

  const handleResetFilters = useCallback(() => {
    setTerm('all');
    setAcademicYear(null);
    setSearch('');
  }, [setAcademicYear, setSearch, setTerm]);

  const renderItem = useCallback(
    ({ item }: { item: CatalogSubject }) => (
      <SubjectCard
        onPress={() => navigation.navigate(SubjectsRoutes.SubjectDetails, { subjectId: item.id })}
        subject={item}
      />
    ),
    [navigation],
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: SubjectSection }) => (
      <View style={styles.sectionHeader}>
        <AppText variant="h3">
          {section.semester
            ? formatSemesterName(section.semester.name, t.subjects)
            : t.subjects.untitled}
        </AppText>
        {section.isCurrent ? (
          <AppBadge label={t.subjects.badges.currentTerm} variant="brand" />
        ) : null}
        <AppText color="muted" variant="caption">
          {t.subjects.resultsCount(section.data.length)}
        </AppText>
      </View>
    ),
    [t],
  );

  if (showInitialLoading) {
    return (
      <AppScreen contentContainerStyle={styles.content} scroll>
        <AppHeader subtitle={t.subjects.subtitle} title={t.subjects.title} />
        <SkeletonList />
      </AppScreen>
    );
  }

  if (showInitialError) {
    return (
      <AppScreen contentContainerStyle={styles.content} scroll>
        <AppHeader subtitle={t.subjects.subtitle} title={t.subjects.title} />
        <ErrorState message={errorMessage ?? undefined} onRetry={handleRefresh} />
      </AppScreen>
    );
  }

  const listHeader = (
    <Stack gap="lg" style={styles.listHeader}>
      <AppHeader subtitle={t.subjects.subtitle} title={t.subjects.title} />
      {!isOnline ? (
        <AppText color="muted" variant="caption">
          {t.subjects.offlineNote}
        </AppText>
      ) : null}
      <SubjectFilters
        academicYearId={academicYearId}
        currentTermName={currentTerm?.semester.name ?? null}
        onSearchChange={setSearch}
        onTermChange={setTerm}
        onYearChange={setAcademicYear}
        search={search}
        term={term}
        years={years}
      />
      {errorMessage ? <ErrorState message={errorMessage} onRetry={handleRefresh} /> : null}
    </Stack>
  );

  const emptyView = errorMessage ? null : (
    <EmptyState
      action={
        hasActiveFilter ? (
          <AppButton
            onPress={handleResetFilters}
            title={t.subjects.resetFilters}
            variant="outline"
          />
        ) : (
          <AppButton
            loading={isRefreshing}
            onPress={handleRefresh}
            title={t.common.retryVerify}
            variant="outline"
          />
        )
      }
      artwork={hasActiveFilter ? 'search' : 'subjects'}
      illustrationLabel={
        hasActiveFilter ? t.common.noSearchResultsAlt : t.subjects.emptyIllustrationAlt
      }
      message={hasActiveFilter ? t.subjects.emptyFilteredMessage : t.subjects.emptyMessage}
      title={hasActiveFilter ? t.common.searchNoResultsTitle : t.subjects.emptyTitle}
    />
  );

  return (
    <AppScreen safeArea scroll={false}>
      <SectionList
        ItemSeparatorComponent={ListGap}
        ListEmptyComponent={emptyView}
        ListFooterComponent={
          lastLoadedAt ? (
            <AppText align="center" color="muted" style={styles.footer} variant="caption">
              {t.common.lastUpdatedAt(formatTime(lastLoadedAt, locale) ?? '')}
            </AppText>
          ) : null
        }
        ListHeaderComponent={listHeader}
        contentContainerStyle={styles.listContent}
        initialNumToRender={10}
        keyExtractor={keyExtractor}
        keyboardShouldPersistTaps="handled"
        maxToRenderPerBatch={10}
        refreshControl={<BrandRefreshControl onRefresh={handleRefresh} refreshing={isRefreshing} />}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        sections={sections}
        stickySectionHeadersEnabled={false}
        windowSize={7}
      />
    </AppScreen>
  );
}

function ListGap() {
  return <View style={styles.gap} />;
}

function keyExtractor(subject: CatalogSubject) {
  return String(subject.id);
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
  },
  listContent: {
    paddingBottom: spacing.xxl,
    paddingTop: spacing.lg,
  },
  listHeader: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
  gap: { height: spacing.md },
  footer: { marginTop: spacing.lg },
});
