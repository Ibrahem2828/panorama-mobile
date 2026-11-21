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
  HomeRoutes,
  LecturesRoutes,
  ProfileRoutes,
  SharedRoutes,
  SubjectsRoutes,
  TabRoutes,
} from '../../../navigation/routes';
import type { AppTabsParamList, HomeStackParamList } from '../../../navigation/types';
import { normalizeApiError } from '../../../api';
import { shouldSearchLocally } from '../../../offline/localSearch';
import { useNetworkStore } from '../../../offline/networkStore';
import { useRefreshOnReconnect } from '../../../offline/useRefreshOnReconnect';
import { layout, opacity, spacing, useBrand } from '../../../theme';
import { useOfflineLibrary } from '../../lectures/offline/offlineLibrary';
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
import { OfflineSearchNote } from '../components/OfflineSearchNotice';
import {
  searchCachedLists,
  searchDownloadedEntries,
  type DownloadedHit,
} from '../services/offlineSearch';
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
  // No connection: the answer comes from what is saved on the phone, and the query runs again by itself when it is back.
  const [localMode, setLocalMode] = useState(false);
  const [downloaded, setDownloaded] = useState<DownloadedHit[]>([]);
  const isStudent = role === 'student';
  const state = searchQueryState(query);
  const feedbackSent = useRef('');

  // A new text or filter starts again from the first few hits.
  useEffect(() => setLimit(DEFAULT_LIMIT), [state.query, kind]);

  useRefreshOnReconnect(() => {
    // Only a search that was answered from the phone (or failed) needs to run again; a good answer stays as it is.
    if (localMode || errorMessage) setRetryTick((tick) => tick + 1);
  });

  useEffect(() => {
    if (!state.valid || !accessToken) {
      setResult(EMPTY_SEARCH_RESULT);
      setErrorMessage(null);
      setIsLoading(false);
      setLocalMode(false);
      setDownloaded([]);
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
          setLocalMode(false);
          setDownloaded([]);

          if (feedbackSent.current !== state.query) {
            feedbackSent.current = state.query;
            void requestFeedbackPrompt({
              context: 'search',
              actionKey: 'search.completed',
              metadata: { result_count: next.total },
            });
          }
        })
        .catch(async (error: unknown) => {
          if (controller.signal.aborted) return;
          const normalized = normalizeApiError(error);

          if (
            shouldSearchLocally({
              isOnline: useNetworkStore.getState().isOnline,
              errorCode: normalized.code,
              status: normalized.status,
            })
          ) {
            const wanted = kind === 'all' ? [] : [kind];
            const local = await searchCachedLists(state.query, wanted);

            if (controller.signal.aborted) return;
            setResult(local);
            // A saved file that the saved lists also found is shown once, in its own section.
            setDownloaded(
              searchDownloadedEntries(
                useOfflineLibrary.getState().entries,
                state.query,
                wanted,
              ).filter(
                (hit) =>
                  hit.kind !== 'file' ||
                  !local.files.some((item) => String(item.id) === String(hit.id)),
              ),
            );
            setLocalMode(true);
            return;
          }

          setLocalMode(false);
          setDownloaded([]);
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

  const openDownloaded = useCallback(
    (hit: DownloadedHit) =>
      hit.kind === 'file'
        ? navigation.navigate(SharedRoutes.PdfViewer, {
            fileId: hit.id,
            title: hit.title,
            offline: true,
          })
        : navigation.navigate(LecturesRoutes.LectureViewer, {
            lectureId: hit.id,
            title: hit.title,
            offline: true,
          }),
    [navigation],
  );

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
      file: t.search.kindFile,
      announcement: t.search.kindAnnouncement,
    }),
    [t],
  );
  const sectionTitles: Record<SearchResultKind, string> = {
    subject: t.search.subjectsSection,
    file: t.search.filesSection,
    announcement: t.search.announcementsSection,
  };
  const sections: Section[] = (
    [
      ['subject', result.subjects],
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
          : item.kind === 'file'
            ? t.search.untitledFile
            : t.search.untitledAnnouncement;
      const fallbackSubtitle =
        item.kind === 'subject'
          ? t.search.subjectSubtitle
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
      {localMode && (result.total > 0 || downloaded.length > 0) ? <OfflineSearchNote /> : null}
      {localMode && downloaded.length > 0 ? (
        <Stack gap="sm">
          <AppText color="muted" variant="label" weight="700">
            {`${t.offlineHome.title} · ${t.search.resultsCount(downloaded.length)}`}
          </AppText>
          {downloaded.map((hit) => (
            <Pressable
              accessibilityLabel={`${hit.kind === 'file' ? t.offlineSearch.savedFile : t.offlineSearch.savedLecture}: ${hit.title}`}
              accessibilityRole="button"
              key={`${hit.kind}-${hit.id}`}
              onPress={() => openDownloaded(hit)}
              style={({ pressed }) => (pressed ? styles.pressed : null)}
            >
              <AppCard padding="md" variant="default">
                <Stack align="center" direction="horizontal" gap="md">
                  <Stack gap="xs" style={styles.rowBody}>
                    <AppText numberOfLines={2} variant="title">
                      {hit.title}
                    </AppText>
                    <AppText color="secondary" numberOfLines={1} variant="bodySmall">
                      {hit.subjectName ??
                        (hit.kind === 'file'
                          ? t.offlineSearch.savedFile
                          : t.offlineSearch.savedLecture)}
                    </AppText>
                  </Stack>
                  <AppBadge
                    label={hit.kind === 'file' ? t.search.kindFile : t.offlineHome.kindLecture}
                    variant="brand"
                  />
                </Stack>
              </AppCard>
            </Pressable>
          ))}
        </Stack>
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
          ) : localMode && !isLoading ? (
            downloaded.length > 0 ? null : (
              <EmptyState
                action={
                  <AppButton
                    onPress={() => navigation.navigate(ProfileRoutes.Downloads)}
                    title={t.offlineSearch.openDownloads}
                    variant="outline"
                  />
                }
                artwork="search"
                message={t.offlineSearch.emptyMessage}
                title={t.offlineSearch.emptyTitle}
              />
            )
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
