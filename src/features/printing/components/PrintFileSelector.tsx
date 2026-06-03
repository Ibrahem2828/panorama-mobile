import { Pressable, StyleSheet } from 'react-native';

import { AppBadge, AppCard, AppText, Stack } from '../../../components';
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

export function PrintFileSelector({
  files,
  selectedFileId,
  selectedFileTitle,
  error,
  isLoading = false,
  onSelectFile,
  onRefresh,
}: PrintFileSelectorProps) {
  const visibleFiles = files.slice(0, 8);

  return (
    <Stack gap="md">
      <Stack gap="xs">
        <AppText variant="title">الملف المطلوب طباعته</AppText>
        <AppText color="secondary" variant="bodySmall">
          اختر ملفا من الملفات التي يسمح لك الباك إند بالوصول إليها.
        </AppText>
      </Stack>

      {selectedFileId !== null ? (
        <AppCard variant="muted">
          <Stack gap="xs">
            <AppText color="muted" variant="caption">
              الملف المحدد
            </AppText>
            <AppText variant="bodySmall">
              {selectedFileTitle ?? `ملف #${String(selectedFileId)}`}
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
            const title = getFileDisplayTitle(file);
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
              {isLoading ? 'جاري تحميل الملفات...' : 'لا توجد ملفات متاحة للطباعة حاليا.'}
            </AppText>
            {onRefresh ? (
              <Pressable accessibilityRole="button" onPress={onRefresh} style={styles.inlineAction}>
                <AppText color="brand" variant="button">
                  تحديث الملفات
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
