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
import {
  SEARCH_CLEAR_LABEL,
  SEARCH_NO_RESULTS_MESSAGE,
  SEARCH_NO_RESULTS_TITLE,
} from '../../../utils/searchEmptyState';
import { SubjectCard, SubjectSearchBar } from '../components';
import { filterSubjectsBySearch } from '../services';
import { useSubjectsStore } from '../store';
import type { Subject } from '../types';

type SubjectsListScreenProps = NativeStackScreenProps<SubjectsStackParamList, 'SubjectsList'>;

export function SubjectsListScreen({ navigation }: SubjectsListScreenProps) {
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
    () => filterSubjectsBySearch(subjects, search),
    [subjects, search],
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
        <AppHeader subtitle="موادك حسب بياناتك الأكاديمية" title="موادي" />
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
        <AppHeader subtitle="موادك حسب بياناتك الأكاديمية" title="موادي" />
        <LoadingState message="جاري تحميل المواد..." />
      </AppScreen>
    );
  }

  if (showInitialError) {
    return (
      <AppScreen contentContainerStyle={styles.content} scroll>
        <AppHeader subtitle="موادك حسب بياناتك الأكاديمية" title="موادي" />
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
              title="تحديث"
              variant="outline"
            />
          }
          subtitle="الفلاتر الأكاديمية تأتي من ملف الطالب: الاختصاص، السنة، والفصل عند توفرها."
          title="قائمة المواد"
        />

        {errorMessage ? (
          <ErrorState message={errorMessage} onRetry={handleRefresh} />
        ) : filteredSubjects.length === 0 ? (
          <EmptyState
            action={
              search ? (
                <AppButton
                  onPress={() => setSearch('')}
                  title={SEARCH_CLEAR_LABEL}
                  variant="outline"
                />
              ) : (
                <AppButton
                  loading={isRefreshing}
                  onPress={handleRefresh}
                  title="إعادة التحقق"
                  variant="outline"
                />
              )
            }
            message={search ? SEARCH_NO_RESULTS_MESSAGE : 'لا توجد مواد متاحة حاليا.'}
            title={search ? SEARCH_NO_RESULTS_TITLE : 'لا توجد مواد'}
            illustrationLabel={search ? 'رسم يوضح عدم وجود نتائج بحث' : 'رسم يوضح عدم وجود مواد'}
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
            آخر تحديث: {new Date(lastLoadedAt).toLocaleTimeString('ar-SY')}
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
