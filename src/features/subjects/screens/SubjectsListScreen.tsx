import { useCallback, useEffect, useMemo } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlatList, StyleSheet, View } from 'react-native';

import {
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
import { SubjectsRoutes } from '../../../navigation/routes';
import type { SubjectsStackParamList } from '../../../navigation/types';
import { spacing } from '../../../theme';
import { SubjectCard, SubjectLevelFilter, SubjectSearchBar } from '../components';
import { CurrentTermCard } from '../../academic-term/components/CurrentTermCard';
import { useTermStore } from '../../academic-term/termStore';
import { useStudentProfileStore } from '../../student-profile';
import { filterSubjectsBySearch } from '../services';
import { useSubjectsStore } from '../store';
import type { Subject } from '../types';
import { useTranslation } from '../../../i18n';
import { formatTime } from '../../../utils/formatDateTime';

type SubjectsListScreenProps = NativeStackScreenProps<SubjectsStackParamList, 'SubjectsList'>;

export function SubjectsListScreen({ navigation }: SubjectsListScreenProps) {
  const { t, locale } = useTranslation();
  const subjects = useSubjectsStore((state) => state.subjects);
  const search = useSubjectsStore((state) => state.search);
  const isLoading = useSubjectsStore((state) => state.isLoading);
  const isRefreshing = useSubjectsStore((state) => state.isRefreshing);
  const errorMessage = useSubjectsStore((state) => state.errorMessage);
  const lastLoadedAt = useSubjectsStore((state) => state.lastLoadedAt);
  const totalCount = useSubjectsStore((state) => state.totalCount);
  const loadSubjects = useSubjectsStore((state) => state.loadSubjects);
  const refreshSubjects = useSubjectsStore((state) => state.refreshSubjects);
  const setSearch = useSubjectsStore((state) => state.setSearch);
  const setSelectedSubject = useSubjectsStore((state) => state.setSelectedSubject);
  const setLevelFilter = useSubjectsStore((state) => state.setLevelFilter);
  const academicYearId = useSubjectsStore((state) => state.academicYearId);
  const semesterId = useSubjectsStore((state) => state.semesterId);
  const years = useStudentProfileStore((state) => state.academicYears);
  const semesters = useStudentProfileStore((state) => state.semesters);
  const currentSemesterId = useTermStore((state) => state.currentTerm?.semester.id ?? null);
  const filteredSubjects = useMemo(
    () => filterSubjectsBySearch(subjects, search, t.subjects),
    [subjects, search, t.subjects],
  );
  const showInitialLoading = isLoading && !lastLoadedAt;
  const showInitialError = Boolean(errorMessage && !lastLoadedAt);

  useEffect(() => {
    void loadSubjects();
  }, [loadSubjects]);

  function handleRefresh() {
    void refreshSubjects();
  }

  function handleSubjectPress(subject: Subject) {
    setSelectedSubject(subject);
    navigation.navigate(SubjectsRoutes.SubjectDetails, { subjectId: subject.id });
  }

  const renderItem = useCallback(
    ({ item }: { item: Subject }) => (
      <SubjectCard onPress={() => handleSubjectPress(item)} subject={item} />
    ),
    [],
  );

  function renderHeader() {
    return (
      <Stack gap="lg">
        <AppHeader subtitle={t.subjects.subtitle} title={t.subjects.title} />
        <CurrentTermCard />
        <SubjectLevelFilter
          academicYearId={academicYearId}
          currentSemesterId={currentSemesterId}
          onChange={setLevelFilter}
          semesterId={semesterId}
          semesters={semesters}
          years={years}
        />
        <AppText color="muted" variant="caption">
          {t.subjects.levelHint}
        </AppText>
        <SubjectSearchBar
          onChangeText={setSearch}
          resultCount={filteredSubjects.length}
          totalCount={subjects.length || totalCount}
          value={search}
        />
      </Stack>
    );
  }

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
      {renderHeader()}
      {errorMessage ? <ErrorState message={errorMessage} onRetry={handleRefresh} /> : null}
    </Stack>
  );

  const emptyView = errorMessage ? null : (
    <EmptyState
      action={
        search ? (
          <AppButton onPress={() => setSearch('')} title={t.common.searchClear} variant="outline" />
        ) : (
          <AppButton
            loading={isRefreshing}
            onPress={handleRefresh}
            title={t.common.retryVerify}
            variant="outline"
          />
        )
      }
      illustrationLabel={search ? t.common.noSearchResultsAlt : t.subjects.emptyIllustrationAlt}
      artwork={search ? 'search' : 'subjects'}
      message={search ? t.common.searchNoResultsMessage : t.subjects.emptyMessage}
      title={search ? t.common.searchNoResultsTitle : t.subjects.emptyTitle}
    />
  );

  return (
    <AppScreen safeArea scroll={false}>
      <FlatList
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
        data={filteredSubjects}
        initialNumToRender={10}
        keyExtractor={keyExtractor}
        keyboardShouldPersistTaps="handled"
        maxToRenderPerBatch={10}
        refreshControl={<BrandRefreshControl onRefresh={handleRefresh} refreshing={isRefreshing} />}
        removeClippedSubviews
        renderItem={renderItem}
        windowSize={7}
      />
    </AppScreen>
  );
}

function ListGap() {
  return <View style={styles.gap} />;
}

function keyExtractor(subject: Subject) {
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
  gap: { height: spacing.md },
  footer: { marginTop: spacing.lg },
});
