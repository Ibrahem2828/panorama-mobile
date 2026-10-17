import { useCallback, useEffect, useMemo, useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlatList, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import {
  AppButton,
  AppHeader,
  AppScreen,
  AppText,
  AppTextInput,
  EmptyState,
  ErrorState,
  SkeletonList,
  Stack,
} from '../../../components';
import { useTranslation } from '../../../i18n';
import { LecturesRoutes } from '../../../navigation/routes';
import type { HomeStackParamList } from '../../../navigation/types';
import { getFlexDirection } from '../../../utils/rtl';
import { colors, spacing, useBrand } from '../../../theme';
import { FilterChip } from '../components/FilterChip';
import { LectureCard } from '../components/LectureCard';
import {
  GENERAL_LECTURES_FILTER,
  filterLectures,
  isGeneralLecture,
  uniqueSubjects,
} from '../logic';
import { useLecturesStore } from '../store';
import type { Lecture } from '../types';

type Props = NativeStackScreenProps<HomeStackParamList, 'LecturesList'>;

const keyExtractor = (lecture: Lecture) => String(lecture.id);

export function LecturesListScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const brand = useBrand();
  const lectures = useLecturesStore((state) => state.lectures);
  const isLoading = useLecturesStore((state) => state.isLoading);
  const isRefreshing = useLecturesStore((state) => state.isRefreshing);
  const errorKind = useLecturesStore((state) => state.errorKind);
  const lastLoadedAt = useLecturesStore((state) => state.lastLoadedAt);
  const load = useLecturesStore((state) => state.load);
  const refresh = useLecturesStore((state) => state.refresh);
  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState<string>(
    route.params?.subjectId === undefined ? '' : String(route.params.subjectId),
  );

  useEffect(() => {
    void load();
  }, [load]);

  const subjects = useMemo(() => uniqueSubjects(lectures), [lectures]);
  const hasGeneral = useMemo(() => lectures.some(isGeneralLecture), [lectures]);
  // Chips help when there is more than one subject, or both subject and general lectures.
  const showChips = subjects.length > 1 || (subjects.length > 0 && hasGeneral);
  const filtered = useMemo(
    () => filterLectures(lectures, { search, subject }),
    [lectures, search, subject],
  );
  const filtering = search.trim().length > 0 || subject !== '';

  const openLecture = useCallback(
    (lecture: Lecture) => {
      navigation.navigate(LecturesRoutes.LectureViewer, {
        lectureId: lecture.id,
        title: lecture.title ?? undefined,
      });
    },
    [navigation],
  );

  const renderItem = useCallback(
    ({ item }: { item: Lecture }) => <LectureCard lecture={item} onPress={openLecture} />,
    [openLecture],
  );

  const handleRefresh = useCallback(() => void refresh(), [refresh]);
  const clearFilters = useCallback(() => {
    setSearch('');
    setSubject('');
  }, []);

  const header = <AppHeader subtitle={t.lectures.subtitle} title={t.lectures.title} />;

  if (isLoading && lastLoadedAt === null) {
    return (
      <AppScreen contentContainerStyle={styles.content} scroll>
        {header}
        <SkeletonList />
      </AppScreen>
    );
  }

  if (errorKind && lastLoadedAt === null) {
    return (
      <AppScreen contentContainerStyle={styles.content} scroll>
        {header}
        <ErrorState message={t.lectures.errors[errorKind]} onRetry={handleRefresh} />
      </AppScreen>
    );
  }

  return (
    <AppScreen horizontalPadding={false}>
      <FlatList
        ListEmptyComponent={
          filtering ? (
            <EmptyState
              action={
                <AppButton onPress={clearFilters} title={t.common.searchClear} variant="outline" />
              }
              message={t.common.searchNoResultsMessage}
              title={t.common.searchNoResultsTitle}
            />
          ) : (
            <EmptyState
              action={
                <AppButton
                  loading={isRefreshing}
                  onPress={handleRefresh}
                  title={t.common.retryVerify}
                  variant="outline"
                />
              }
              message={t.lectures.emptyMessage}
              title={t.lectures.emptyTitle}
            />
          )
        }
        ListHeaderComponent={
          <Stack gap="md" style={styles.header}>
            {header}
            <AppTextInput
              accessibilityLabel={t.lectures.searchPlaceholder}
              autoCorrect={false}
              onChangeText={setSearch}
              placeholder={t.lectures.searchPlaceholder}
              returnKeyType="search"
              value={search}
            />
            {showChips ? (
              <ScrollView
                contentContainerStyle={styles.chips}
                horizontal
                showsHorizontalScrollIndicator={false}
              >
                <FilterChip
                  label={t.lectures.allSubjects}
                  onPress={() => setSubject('')}
                  selected={subject === ''}
                />
                {hasGeneral ? (
                  <FilterChip
                    label={t.lectures.generalFilter}
                    onPress={() => setSubject(GENERAL_LECTURES_FILTER)}
                    selected={subject === GENERAL_LECTURES_FILTER}
                  />
                ) : null}
                {subjects.map((item) => (
                  <FilterChip
                    key={item.id}
                    label={item.name}
                    onPress={() => setSubject(item.id)}
                    selected={subject === item.id}
                  />
                ))}
              </ScrollView>
            ) : null}
            {errorKind ? (
              <ErrorState message={t.lectures.errors[errorKind]} onRetry={handleRefresh} />
            ) : null}
            <AppText color="muted" variant="caption">
              {t.lectures.totalCount(filtered.length)}
            </AppText>
          </Stack>
        }
        contentContainerStyle={styles.list}
        data={filtered}
        initialNumToRender={8}
        ItemSeparatorComponent={Separator}
        keyExtractor={keyExtractor}
        maxToRenderPerBatch={8}
        refreshControl={
          <RefreshControl
            colors={[brand.primary]}
            progressBackgroundColor={colors.background.elevated}
            onRefresh={handleRefresh}
            refreshing={isRefreshing}
            tintColor={brand.primary}
          />
        }
        removeClippedSubviews
        renderItem={renderItem}
        windowSize={7}
      />
    </AppScreen>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  content: { gap: spacing.xl },
  header: { paddingBottom: spacing.md },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  separator: { height: spacing.md },
  chips: { flexDirection: getFlexDirection('row'), gap: spacing.sm },
});
