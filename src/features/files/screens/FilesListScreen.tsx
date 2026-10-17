import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import {
  AppButton,
  AppHeader,
  AppIconButton,
  AppScreen,
  AppText,
  AppTextInput,
  ChoiceChips,
  EmptyState,
  ErrorState,
  Icon,
  SkeletonList,
  Stack,
} from '../../../components';
import { useTranslation } from '../../../i18n';
import { SharedRoutes } from '../../../navigation/routes';
import type { HomeStackParamList } from '../../../navigation/types';
import { colors, layout, spacing, useBrand } from '../../../theme';
import { FileCard } from '../components';
import { useFilesStore } from '../store';
import type { FileResource, FilesListQuery, FilesOrdering } from '../types';

type FilesListScreenProps = NativeStackScreenProps<HomeStackParamList, 'FilesList'>;

const SEARCH_DEBOUNCE_MS = 350;

type FileRowProps = { file: FileResource; onPress: (file: FileResource) => void };

const FileRow = memo(function FileRow({ file, onPress }: FileRowProps) {
  return <FileCard file={file} onPress={() => onPress(file)} />;
});

function keyExtractor(file: FileResource) {
  return String(file.id);
}

function Separator() {
  return <View style={styles.separator} />;
}

export function FilesListScreen({ navigation, route }: FilesListScreenProps) {
  const { t } = useTranslation();
  const brand = useBrand();
  const subjectId = route.params?.subjectId;
  const subjectName = route.params?.subjectName;
  const list = useFilesStore((state) => state.list);
  const listCount = useFilesStore((state) => state.listCount);
  const nextPage = useFilesStore((state) => state.listNextPage);
  const hasLoaded = useFilesStore((state) => state.hasLoadedList);
  const isLoading = useFilesStore((state) => state.isLoadingList);
  const isLoadingMore = useFilesStore((state) => state.isLoadingMoreList);
  const isRefreshing = useFilesStore((state) => state.isRefreshingList);
  const listError = useFilesStore((state) => state.listError);
  const loadMoreError = useFilesStore((state) => state.loadMoreError);
  const loadList = useFilesStore((state) => state.loadList);
  const refreshList = useFilesStore((state) => state.refreshList);
  const loadMoreList = useFilesStore((state) => state.loadMoreList);
  const setSelectedFile = useFilesStore((state) => state.setSelectedFile);
  const [searchText, setSearchText] = useState('');
  const [search, setSearch] = useState('');
  const [ordering, setOrdering] = useState<FilesOrdering>('');
  const [printableOnly, setPrintableOnly] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchText.trim()), SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [searchText]);

  const query = useMemo<FilesListQuery>(
    () => ({ search, subjectId, ordering, printableOnly }),
    [ordering, printableOnly, search, subjectId],
  );

  useEffect(() => {
    void loadList(query);
  }, [loadList, query]);

  const handleOpen = useCallback(
    (file: FileResource) => {
      setSelectedFile(file);
      navigation.navigate(SharedRoutes.FileDetails, { fileId: file.id });
    },
    [navigation, setSelectedFile],
  );
  const handleRefresh = useCallback(() => void refreshList(), [refreshList]);
  const handleEndReached = useCallback(() => void loadMoreList(), [loadMoreList]);
  const handleClearSubject = useCallback(
    () => navigation.setParams({ subjectId: undefined, subjectName: undefined }),
    [navigation],
  );
  const handleClearFilters = useCallback(() => {
    setSearchText('');
    setSearch('');
    setOrdering('');
    setPrintableOnly(false);
  }, []);
  const renderItem = useCallback(
    ({ item }: { item: FileResource }) => <FileRow file={item} onPress={handleOpen} />,
    [handleOpen],
  );
  const orderingOptions = useMemo(
    () => [
      { value: '' as FilesOrdering, label: t.files.list.newest },
      { value: 'created_at' as FilesOrdering, label: t.files.list.oldest },
      { value: 'title' as FilesOrdering, label: t.files.list.titleAsc },
      { value: '-file_size' as FilesOrdering, label: t.files.list.largest },
    ],
    [t],
  );
  const printableOptions = useMemo(
    () => [
      { value: 'all', label: t.files.list.all },
      { value: 'printable', label: t.files.list.printableOnly },
    ],
    [t],
  );
  const hasFilters = Boolean(search || ordering || printableOnly);

  const header = (
    <Stack gap="lg" style={styles.header}>
      <AppHeader
        subtitle={hasLoaded ? t.files.list.total(listCount) : t.files.subtitle}
        title={t.files.title}
      />
      <AppTextInput
        autoCorrect={false}
        onChangeText={setSearchText}
        placeholder={t.files.searchPlaceholder}
        returnKeyType="search"
        value={searchText}
      />
      {subjectId !== undefined ? (
        <Stack align="center" direction="horizontal" gap="sm" wrap>
          <AppText color="brand" variant="bodySmall" weight="700">
            {t.files.list.subjectFilter(subjectName ?? t.files.list.subjectFallback)}
          </AppText>
          <AppIconButton
            accessibilityLabel={t.files.list.clearSubject}
            icon={<Icon name="close" size={18} />}
            onPress={handleClearSubject}
            size="sm"
            variant="ghost"
          />
        </Stack>
      ) : null}
      <ChoiceChips
        label={t.files.list.orderingLabel}
        onChange={setOrdering}
        options={orderingOptions}
        value={ordering}
      />
      <ChoiceChips
        hideLabel
        label={t.files.list.filtersLabel}
        onChange={(value) => setPrintableOnly(value === 'printable')}
        options={printableOptions}
        value={printableOnly ? 'printable' : 'all'}
      />
    </Stack>
  );

  if (isLoading && !hasLoaded) {
    return (
      <AppScreen contentContainerStyle={styles.centerContent} scroll>
        {header}
        <SkeletonList />
      </AppScreen>
    );
  }

  if (listError && !hasLoaded) {
    return (
      <AppScreen contentContainerStyle={styles.centerContent} scroll>
        {header}
        <ErrorState message={listError} onRetry={() => void loadList(query)} />
      </AppScreen>
    );
  }

  return (
    <AppScreen horizontalPadding={false}>
      <FlatList
        ItemSeparatorComponent={Separator}
        ListEmptyComponent={
          isLoading ? (
            <SkeletonList />
          ) : listError ? (
            <ErrorState message={listError} onRetry={() => void loadList(query)} />
          ) : hasFilters || subjectId !== undefined ? (
            <EmptyState
              action={
                <AppButton
                  onPress={handleClearFilters}
                  title={t.common.searchClear}
                  variant="outline"
                />
              }
              illustrationLabel={t.common.noSearchResultsAlt}
              artwork="search"
              message={t.common.searchNoResultsMessage}
              title={t.common.searchNoResultsTitle}
            />
          ) : (
            <EmptyState
              action={
                <AppButton onPress={handleRefresh} title={t.common.refresh} variant="outline" />
              }
              illustrationLabel={t.files.emptyIllustrationAlt}
              artwork="files"
              message={t.files.emptyMessage}
              title={t.files.emptyTitle}
            />
          )
        }
        ListFooterComponent={
          <View style={styles.footer}>
            {isLoadingMore ? <ActivityIndicator color={brand.primary} /> : null}
            {loadMoreError ? (
              <Stack align="center" gap="sm">
                <AppText align="center" color="error" variant="bodySmall">
                  {loadMoreError}
                </AppText>
                <AppButton
                  onPress={handleEndReached}
                  size="sm"
                  title={t.common.retry}
                  variant="outline"
                />
              </Stack>
            ) : null}
            {!isLoadingMore && !loadMoreError && nextPage !== null ? (
              <AppButton
                onPress={handleEndReached}
                size="sm"
                title={t.files.list.loadMore}
                variant="outline"
              />
            ) : null}
          </View>
        }
        ListHeaderComponent={header}
        contentContainerStyle={styles.listContent}
        data={list}
        initialNumToRender={8}
        keyExtractor={keyExtractor}
        keyboardShouldPersistTaps="handled"
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.4}
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

const styles = StyleSheet.create({
  centerContent: { gap: spacing.xl },
  header: { marginBottom: spacing.lg },
  listContent: {
    paddingHorizontal: layout.screenHorizontalPadding,
    paddingTop: layout.screenVerticalPadding,
    paddingBottom: layout.screenVerticalPadding,
    flexGrow: 1,
  },
  separator: { height: spacing.md },
  footer: { paddingVertical: spacing.lg, alignItems: 'center', minHeight: spacing.xxl },
});
