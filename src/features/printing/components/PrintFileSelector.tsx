import { useMemo, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { AppBadge, AppCard, AppText, AppTextInput, Stack } from '../../../components';
import { useTranslation, type TranslationCatalog } from '../../../i18n';
import { opacity, spacing } from '../../../theme';
import { getFileDisplayTitle, getFileExtension } from '../../files/services';
import type { FileResource, Id } from '../../files/types';

type PrintFileSelectorProps = {
  files: FileResource[];
  selectedFileId: Id | null;
  selectedFileTitle: string | null;
  error?: string;
  isLoading?: boolean;
  onSelectFile: (file: FileResource) => void;
  onRefresh?: () => void;
};

function isSameId(left: Id, right: Id): boolean {
  return String(left) === String(right);
}

function matchesFileSearch(
  file: FileResource,
  query: string,
  filesCatalog: TranslationCatalog['files'],
): boolean {
  if (!query) {
    return true;
  }

  const searchableText = [
    getFileDisplayTitle(file, filesCatalog),
    getFileExtension(file),
    String(file.id),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return searchableText.includes(query.toLowerCase());
}

export function PrintFileSelector({
  files,
  selectedFileId,
  selectedFileTitle,
  error,
  isLoading = false,
  onSelectFile,
  onRefresh,
}: PrintFileSelectorProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const normalizedSearchQuery = searchQuery.trim();
  const visibleFiles = useMemo(
    () => files.filter((file) => matchesFileSearch(file, normalizedSearchQuery, t.files)),
    [files, normalizedSearchQuery, t.files],
  );

  return (
    <Stack gap="md">
      <Stack gap="xs">
        <AppText variant="title">{t.printing.fileSelector.title}</AppText>
        <AppText color="secondary" variant="bodySmall">
          {t.printing.fileSelector.description}
        </AppText>
      </Stack>

      {files.length > 0 ? (
        <AppTextInput
          label={t.printing.fileSelector.searchLabel}
          onChangeText={setSearchQuery}
          placeholder={t.printing.fileSelector.searchPlaceholder}
          value={searchQuery}
        />
      ) : null}

      {selectedFileId !== null ? (
        <AppCard variant="muted">
          <Stack gap="xs">
            <AppText color="muted" variant="caption">
              {t.printing.fileSelector.selectedLabel}
            </AppText>
            <AppText variant="bodySmall">
              {selectedFileTitle ?? t.printing.fileSelector.unnamedFile(String(selectedFileId))}
            </AppText>
          </Stack>
        </AppCard>
      ) : null}

      {error ? (
        <AppText color="error" variant="bodySmall">
          {error}
        </AppText>
      ) : null}

      {visibleFiles.length > 0 ? (
        <Stack gap="sm">
          {visibleFiles.map((file) => {
            const title = getFileDisplayTitle(file, t.files);
            const extension = getFileExtension(file)?.toUpperCase();
            const isSelected = selectedFileId !== null && isSameId(selectedFileId, file.id);

            return (
              <Pressable
                accessibilityRole="button"
                key={String(file.id)}
                onPress={() => onSelectFile(file)}
                style={({ pressed }) => [pressed ? styles.pressed : null]}
              >
                <AppCard variant={isSelected ? 'outlined' : 'default'}>
                  <Stack direction="horizontal" gap="md" style={styles.fileRow}>
                    <Stack gap="xs" style={styles.fileTitle}>
                      <AppText numberOfLines={2} variant="bodySmall" weight="600">
                        {title}
                      </AppText>
                      <AppText color="muted" variant="caption">
                        #{String(file.id)}
                      </AppText>
                    </Stack>
                    {extension ? <AppBadge label={extension} variant="info" /> : null}
                  </Stack>
                </AppCard>
              </Pressable>
            );
          })}
        </Stack>
      ) : (
        <AppCard variant="muted">
          <Stack gap="sm">
            <AppText color="secondary" variant="bodySmall">
              {isLoading
                ? t.printing.fileSelector.loading
                : normalizedSearchQuery
                  ? t.printing.fileSelector.noMatches
                  : t.printing.fileSelector.noFiles}
            </AppText>
            {onRefresh ? (
              <Pressable accessibilityRole="button" onPress={onRefresh} style={styles.inlineAction}>
                <AppText color="brand" variant="button">
                  {t.printing.fileSelector.refresh}
                </AppText>
              </Pressable>
            ) : null}
          </Stack>
        </AppCard>
      )}
    </Stack>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: opacity.pressed,
  },
  fileRow: {
    alignItems: 'flex-start',
  },
  fileTitle: {
    flex: 1,
    minWidth: 0,
  },
  inlineAction: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
  },
});
