import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActivityIndicator, Pressable, SectionList, StyleSheet, View } from 'react-native';

import {
  AppBadge,
  AppButton,
  AppCard,
  AppHeader,
  AppScreen,
  AppText,
  AppTextInput,
  ChoiceChips,
  EmptyState,
  ErrorState,
  Stack,
} from '../../../components';
import { useTranslation } from '../../../i18n';
import {
  GroupsRoutes,
  HomeRoutes,
  SharedRoutes,
  SubjectsRoutes,
  TabRoutes,
} from '../../../navigation/routes';
import type { AppTabsParamList, HomeStackParamList } from '../../../navigation/types';
import { layout, opacity, spacing, useBrand } from '../../../theme';
import { useAuthStore } from '../../auth/store';
import { useFeedbackStore } from '../../feedback/store';
import { useStudentProfileStore } from '../../student-profile';
import {
  DEFAULT_LIMIT,
  LIMIT_STEP,
  MAX_QUERY_LENGTH,
  canShowMore,
  runGlobalSearch,
  searchQueryState,
  toSafeSearchErrorMessage,
} from '../services';
import type { GlobalSearchResult, SearchResultItem, SearchResultKind } from '../types';
import { EMPTY_SEARCH_RESULT } from '../types';

type Props = NativeStackScreenProps<HomeStackParamList, 'Search'>;
type KindFilter = 'all' | SearchResultKind;
type Section = { kind: SearchResultKind; title: string; data: SearchResultItem[] };

const DEBOUNCE_MS = 300;

function keyExtractor(item: SearchResultItem) {
  return `${item.kind}-${String(item.id)}`;
}

function Separator() {
  return <View style={styles.separator} />;
}

export function SearchScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const brand = useBrand();
  const accessToken = useAuthStore((state) => state.accessToken);
  const role = useAuthStore((state) => state.user?.role?.toLowerCase());
  const facultyId = useStudentProfileStore((state) => state.selectedFacultyId);
  const requestFeedbackPrompt = useFeedbackStore((state) => state.requestPrompt);
  const [query, setQuery] = useState(route.params?.query ?? '');
  const [kind, setKind] = useState<KindFilter>('all');
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [result, setResult] = useState<GlobalSearchResult>(EMPTY_SEARCH_RESULT);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryTick, setRetryTick] = useState(0);
  const isStudent = role === 'student';
  const state = searchQueryState(query);
  const feedbackSent = useRef('');

  // A new text or filter starts again from the first few hits.
  useEffect(() => setLimit(DEFAULT_LIMIT), [state.query, kind]);

  useEffect(() => {
    if (!state.valid || !accessToken) {
      setResult(EMPTY_SEARCH_RESULT);
      setErrorMessage(null);
      setIsLoading(false);
      return undefined;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => {
      setIsLoading(true);
      setErrorMessage(null);
      runGlobalSearch({
        query: state.query,
        authToken: accessToken,
        isStudent,
        facultyId,
        kinds: kind === 'all' ? [] : [kind],
        limit,
        signal: controller.signal,
      })
        .then((next) => {
          if (controller.signal.aborted) return;
          setResult(next);

          if (feedbackSent.current !== state.query) {
            feedbackSent.current = state.query;
            void requestFeedbackPrompt({
              context: 'search',
              actionKey: 'search.completed',
              metadata: { result_count: next.total },
            });
          }
        })
        .catch((error: unknown) => {
          if (controller.signal.aborted) return;
          setErrorMessage(toSafeSearchErrorMessage(error, t.search));
          setResult(EMPTY_SEARCH_RESULT);
        })
        .finally(() => {
          if (!controller.signal.aborted) setIsLoading(false);
        });
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [
    accessToken,
    facultyId,
    isStudent,
    kind,
    limit,
    requestFeedbackPrompt,
    retryTick,
    state.query,
    state.valid,
    t,
  ]);

  const openResult = useCallback(
    (item: SearchResultItem) => {
      if (item.kind === 'file') {
        navigation.navigate(SharedRoutes.FileDetails, { fileId: item.id });
        return;
      }

      if (item.kind === 'announcement') {
        navigation.navigate(HomeRoutes.AnnouncementDetail, { announcementId: item.id });
        return;
      }

      const tabs = navigation.getParent<BottomTabNavigationProp<AppTabsParamList>>();

      if (item.kind === 'group') {
        tabs?.navigate(TabRoutes.Groups, {
          screen: GroupsRoutes.GroupDetails,
          params: { groupId: item.id },
        });
        return;
      }

      tabs?.navigate(TabRoutes.Subjects, {
        screen: SubjectsRoutes.SubjectDetails,
        params: { subjectId: item.id },
      });
    },
    [navigation],
  );

  const kindLabels = useMemo<Record<SearchResultKind, string>>(
    () => ({
      subject: t.search.kindSubject,
      group: t.search.kindGroup,
      file: t.search.kindFile,
      announcement: t.search.kindAnnouncement,
    }),
    [t],
  );
  const sectionTitles: Record<SearchResultKind, string> = {
    subject: t.search.subjectsSection,
    group: t.search.groupsSection,
    file: t.search.filesSection,
    announcement: t.search.announcementsSection,
  };
  const sections: Section[] = (
    [
      ['subject', result.subjects],
      ['group', result.groups],
      ['file', result.files],
      ['announcement', result.announcements],
    ] as const
  )
    .filter(([, items]) => items.length > 0)
    .map(([k, items]) => ({ kind: k, title: sectionTitles[k], data: items as SearchResultItem[] }));
  const filterOptions = useMemo(
    () => [
      { value: 'all' as KindFilter, label: t.search.filterAll },
      { value: 'subject' as KindFilter, label: t.search.subjectsSection },
      { value: 'group' as KindFilter, label: t.search.groupsSection },
      { value: 'file' as KindFilter, label: t.search.filesSection },
      { value: 'announcement' as KindFilter, label: t.search.announcementsSection },
    ],
    [t],
  );

  const renderItem = useCallback(
    ({ item }: { item: SearchResultItem }) => {
      const fallbackTitle =
        item.kind === 'subject'
          ? t.search.untitledSubject
          : item.kind === 'group'
            ? t.search.untitledGroup
            : item.kind === 'file'
              ? t.search.untitledFile
              : t.search.untitledAnnouncement;
      const fallbackSubtitle =
        item.kind === 'subject'
          ? t.search.subjectSubtitle
          : item.kind === 'group'
            ? t.search.groupSubtitle
            : item.kind === 'file'
              ? item.inGroup
                ? t.search.fileInGroup
                : t.search.fileSubtitle
              : t.search.announcementSubtitle;
      const title = item.title || fallbackTitle;

      return (
        <Pressable
          accessibilityLabel={`${kindLabels[item.kind]}: ${title}`}
          accessibilityRole="button"
          onPress={() => openResult(item)}
          style={({ pressed }) => (pressed ? styles.pressed : null)}
        >
          <AppCard padding="md" variant="default">
            <Stack align="center" direction="horizontal" gap="md">
              <Stack gap="xs" style={styles.rowBody}>
                <AppText numberOfLines={2} variant="title">
                  {title}
                </AppText>
                <AppText color="secondary" numberOfLines={1} variant="bodySmall">
                  {item.subtitle || fallbackSubtitle}
                </AppText>
              </Stack>
              <AppBadge label={kindLabels[item.kind]} variant="brand" />
            </Stack>
          </AppCard>
        </Pressable>
      );
    },
    [kindLabels, openResult, t],
  );

  const header = (
    <Stack gap="lg" style={styles.header}>
      <AppHeader subtitle={t.search.subtitle} title={t.search.title} />
      <AppButton onPress={() => navigation.goBack()} title={t.common.back} variant="ghost" />
      <AppTextInput
        autoCapitalize="none"
        autoCorrect={false}
        error={state.tooLong ? t.search.tooLong(MAX_QUERY_LENGTH) : undefined}
        helperText={state.tooShort ? t.search.tooShort : undefined}
        label={t.search.label}
        onChangeText={setQuery}
        placeholder={t.search.placeholder}
        returnKeyType="search"
        value={query}
      />
      <ChoiceChips
        label={t.search.filterLabel}
        onChange={setKind}
        options={filterOptions}
        value={kind}
      />
      {isLoading ? <ActivityIndicator color={brand.primary} /> : null}
      {errorMessage ? (
        <ErrorState message={errorMessage} onRetry={() => setRetryTick((tick) => tick + 1)} />
      ) : null}
      {result.partialFailure ? (
        <AppCard variant="muted">
          <AppText color="secondary" variant="bodySmall">
            {t.search.partialResults}
          </AppText>
        </AppCard>
      ) : null}
    </Stack>
  );

  return (
    <AppScreen horizontalPadding={false}>
      <SectionList
        ItemSeparatorComponent={Separator}
        ListEmptyComponent={
          !state.valid ? (
            <EmptyState message={t.search.startMessage} title={t.search.startTitle} />
          ) : !isLoading && !errorMessage ? (
            <EmptyState message={t.search.noResultsMessage} title={t.common.searchNoResultsTitle} />
          ) : null
        }
        ListHeaderComponent={header}
        contentContainerStyle={styles.listContent}
        keyExtractor={keyExtractor}
        keyboardShouldPersistTaps="handled"
        renderItem={renderItem}
        renderSectionFooter={({ section }) =>
          canShowMore(result, section.kind, limit) ? (
            <AppButton
              onPress={() => setLimit((current) => current + LIMIT_STEP)}
              size="sm"
              title={t.search.showMore}
              variant="ghost"
            />
          ) : (
            <View style={styles.sectionGap} />
          )
        }
        renderSectionHeader={({ section }) => (
          <AppText color="muted" style={styles.sectionTitle} variant="label" weight="700">
            {`${section.title} · ${t.search.resultsCount(result.counts[section.kind])}`}
          </AppText>
        )}
        sections={sections}
        stickySectionHeadersEnabled={false}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: spacing.lg },
  listContent: {
    paddingHorizontal: layout.screenHorizontalPadding,
    paddingTop: layout.screenVerticalPadding,
    paddingBottom: layout.screenVerticalPadding,
    flexGrow: 1,
  },
  separator: { height: spacing.sm },
  sectionTitle: { paddingTop: spacing.md, paddingBottom: spacing.sm },
  sectionGap: { height: spacing.sm },
  rowBody: { flex: 1, minWidth: 0 },
  pressed: { opacity: opacity.pressed },
});
