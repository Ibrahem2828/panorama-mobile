import { useEffect, useMemo } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet } from 'react-native';

import { images } from '../../../assets/images';
import {
  AppButton,
  AppHeader,
  AppScreen,
  AppText,
  EmptyState,
  ErrorState,
  LoadingState,
  SectionHeader,
  Stack,
} from '../../../components';
import { SubjectsRoutes } from '../../../navigation/routes';
import type { SubjectsStackParamList } from '../../../navigation/types';
import { spacing } from '../../../theme';
import { SubjectCard, SubjectSearchBar } from '../components';
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

  function renderHeader() {
    return (
      <Stack gap="lg">
        <AppHeader subtitle={t.subjects.subtitle} title={t.subjects.title} />
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
        <LoadingState message={t.subjects.loading} />
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

  return (
    <AppScreen contentContainerStyle={styles.content} scroll>
      <Stack gap="xl">
        {renderHeader()}

        <SectionHeader
          action={
            <AppButton
              loading={isRefreshing}
              onPress={handleRefresh}
              size="sm"
              title={t.common.refresh}
              variant="outline"
            />
          }
          subtitle={t.subjects.listSubtitle}
          title={t.subjects.listTitle}
        />

        {errorMessage ? (
          <ErrorState message={errorMessage} onRetry={handleRefresh} />
        ) : filteredSubjects.length === 0 ? (
          <EmptyState
            action={
              search ? (
                <AppButton
                  onPress={() => setSearch('')}
                  title={t.common.searchClear}
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
            message={search ? t.common.searchNoResultsMessage : t.subjects.emptyMessage}
            title={search ? t.common.searchNoResultsTitle : t.subjects.emptyTitle}
            illustrationLabel={
              search ? t.common.noSearchResultsAlt : t.subjects.emptyIllustrationAlt
            }
            illustrationSource={search ? images.illustrations.search : images.emptyStates.subjects}
          />
        ) : (
          <Stack gap="md">
            {filteredSubjects.map((subject) => (
              <SubjectCard
                key={String(subject.id)}
                onPress={() => handleSubjectPress(subject)}
                subject={subject}
              />
            ))}
          </Stack>
        )}

        {lastLoadedAt ? (
          <AppText align="center" color="muted" variant="caption">
            {t.common.lastUpdatedAt(formatTime(lastLoadedAt, locale) ?? '')}
          </AppText>
        ) : null}
      </Stack>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
  },
});
