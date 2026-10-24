import { memo, useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';

import {
  AppBadge,
  AppButton,
  AppCard,
  AppHeader,
  AppScreen,
  AppText,
  AppTextInput,
  EmptyState,
  ErrorState,
  LoadingState,
  Stack,
} from '../../../components';
import { useTranslation } from '../../../i18n';
import { layout, opacity, spacing, useBrand } from '../../../theme';
import {
  formatFileSize,
  getFileDisplayTitle,
  getFileExtension,
  getFileSize,
} from '../../files/services';
import type { FileResource, Id } from '../../files/types';
import { usePrintableFiles } from '../hooks/usePrintableFiles';
import { AppModal } from '../../../components/overlay';

type PrintLibraryPickerProps = {
  visible: boolean;
  selectedId: Id | null;
  onSelect: (file: FileResource) => void;
  onClose: () => void;
};

type RowProps = {
  file: FileResource;
  isSelected: boolean;
  onPress: (file: FileResource) => void;
};

const PickerRow = memo(function PickerRow({ file, isSelected, onPress }: RowProps) {
  const { t } = useTranslation();
  const brand = useBrand();
  const title = getFileDisplayTitle(file, t.files);
  const extension = getFileExtension(file)?.toUpperCase();
  const size = formatFileSize(getFileSize(file), t.files);

  return (
    <Pressable
      accessibilityLabel={title}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      onPress={() => onPress(file)}
      style={({ pressed }) => (pressed ? styles.pressed : null)}
    >
      <AppCard
        padding="sm"
        style={isSelected ? { borderColor: brand.primary, borderWidth: 1.5 } : undefined}
        variant="default"
      >
        <Stack align="center" direction="horizontal" gap="md">
          <Stack gap="xs" style={styles.rowBody}>
            <AppText numberOfLines={2} variant="bodySmall" weight="600">
              {title}
            </AppText>
            <AppText color="muted" variant="caption">
              {[`⁦#${String(file.id)}⁩`, size].filter(Boolean).join(' · ')}
            </AppText>
          </Stack>
          {isSelected ? <AppBadge label={t.printing.library.selected} variant="brand" /> : null}
          {extension ? <AppBadge label={extension} variant="info" /> : null}
        </Stack>
      </AppCard>
    </Pressable>
  );
});

function keyExtractor(file: FileResource) {
  return String(file.id);
}

function Separator() {
  return <View style={styles.separator} />;
}

/** Full-screen sheet to choose one of the printable files available to the student. */
export function PrintLibraryPicker({
  visible,
  selectedId,
  onSelect,
  onClose,
}: PrintLibraryPickerProps) {
  const { t } = useTranslation();
  const brand = useBrand();
  const [search, setSearch] = useState('');
  const { files, isLoading, isLoadingMore, error, nextPage, loadMore, reload } = usePrintableFiles(
    search,
    visible,
  );

  const handleSelect = useCallback(
    (file: FileResource) => {
      onSelect(file);
      setSearch('');
    },
    [onSelect],
  );
  const renderItem = useCallback(
    ({ item }: { item: FileResource }) => (
      <PickerRow
        file={item}
        isSelected={selectedId !== null && String(selectedId) === String(item.id)}
        onPress={handleSelect}
      />
    ),
    [handleSelect, selectedId],
  );

  return (
    <AppModal animationType="slide" onRequestClose={onClose} visible={visible}>
      <AppScreen>
        <Stack gap="md" style={styles.header}>
          <AppHeader title={t.printing.library.title} />
          <AppTextInput
            autoCorrect={false}
            onChangeText={setSearch}
            placeholder={t.printing.library.searchPlaceholder}
            returnKeyType="search"
            value={search}
          />
        </Stack>
        {isLoading && files.length === 0 ? (
          <LoadingState message={t.printing.library.loading} />
        ) : error && files.length === 0 ? (
          <ErrorState message={error} onRetry={reload} title={t.printing.library.loadFailed} />
        ) : (
          <FlatList
            ItemSeparatorComponent={Separator}
            ListEmptyComponent={
              <EmptyState
                message={search.trim() ? t.printing.library.noMatches : t.printing.library.noFiles}
                title={t.printing.library.title}
              />
            }
            ListFooterComponent={
              <View style={styles.footer}>
                {isLoadingMore ? <ActivityIndicator color={brand.primary} /> : null}
                {error && files.length > 0 ? (
                  <AppButton
                    onPress={loadMore}
                    size="sm"
                    title={t.common.retry}
                    variant="outline"
                  />
                ) : null}
              </View>
            }
            contentContainerStyle={styles.list}
            data={files}
            keyExtractor={keyExtractor}
            keyboardShouldPersistTaps="handled"
            onEndReached={nextPage !== null ? loadMore : undefined}
            onEndReachedThreshold={0.4}
            removeClippedSubviews
            renderItem={renderItem}
          />
        )}
        <AppButton
          accessibilityLabel={t.printing.library.close}
          onPress={onClose}
          title={t.printing.library.close}
          variant="outline"
        />
      </AppScreen>
    </AppModal>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: spacing.md, marginBottom: spacing.md },
  list: { paddingBottom: spacing.lg, flexGrow: 1 },
  rowBody: { flex: 1, minWidth: 0 },
  pressed: { opacity: opacity.pressed },
  separator: { height: spacing.sm },
  footer: { minHeight: layout.touchTargetMinSize, alignItems: 'center', justifyContent: 'center' },
});
