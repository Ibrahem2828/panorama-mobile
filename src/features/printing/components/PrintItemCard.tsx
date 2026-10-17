import { memo, useCallback, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { AppButton, AppCard, AppIconButton, AppText, Icon, Stack } from '../../../components';
import { useTranslation } from '../../../i18n';
import { colors, radius, spacing, useBrand } from '../../../theme';
import { formatFileSize } from '../../files/services';
import type { FileResource } from '../../files/types';
import { getFileDisplayTitle } from '../../files/services';
import { pickPrintImage } from '../services/imagePicker';
import type { PrintCartItem, PrintItemValidation, PrintSource, UploadProblem } from '../types';
import { PrintCopiesStepper } from './PrintCopiesStepper';
import { PrintItemOptions } from './PrintItemOptions';
import { PrintLibraryPicker } from './PrintLibraryPicker';

type PrintItemCardProps = {
  item: PrintCartItem;
  index: number;
  canRemove: boolean;
  problems?: PrintItemValidation;
  showErrors: boolean;
  onChange: (key: string, patch: Partial<Omit<PrintCartItem, 'key'>>) => void;
  onRemove: (key: string) => void;
};

const THUMB_SIZE = 56;

function PrintItemCardComponent({
  item,
  index,
  canRemove,
  problems,
  showErrors,
  onChange,
  onRemove,
}: PrintItemCardProps) {
  const { t } = useTranslation();
  const brand = useBrand();
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [pickerProblem, setPickerProblem] = useState<UploadProblem | 'error' | null>(null);
  const [isPicking, setIsPicking] = useState(false);

  const setSource = useCallback(
    (source: PrintSource) => onChange(item.key, { source }),
    [item.key, onChange],
  );

  async function handlePickFromDevice() {
    if (isPicking) {
      return;
    }

    setIsPicking(true);
    setPickerProblem(null);

    const result = await pickPrintImage();

    setIsPicking(false);

    if (result.status === 'picked') {
      setSource({ kind: 'upload', file: result.file });
    } else if (result.status === 'invalid') {
      setPickerProblem(result.problem);
    } else if (result.status === 'error') {
      setPickerProblem('error');
    }
  }

  function handleLibrarySelect(file: FileResource) {
    setSource({ kind: 'library', id: file.id, title: getFileDisplayTitle(file, t.files) });
    setLibraryOpen(false);
  }

  const problemText =
    pickerProblem === 'type'
      ? t.printing.create.uploadInvalidType
      : pickerProblem === 'size'
        ? t.printing.create.uploadTooLarge
        : pickerProblem === 'empty'
          ? t.printing.create.uploadEmpty
          : pickerProblem === 'error'
            ? t.printing.create.uploadPickerFailed
            : null;
  const { source } = item;

  return (
    <AppCard variant="outlined">
      <Stack gap="lg">
        <Stack align="center" direction="horizontal" gap="md" justify="space-between">
          <AppText color="brand" variant="title">
            {t.printing.create.itemTitle(index + 1)}
          </AppText>
          {canRemove ? (
            <AppIconButton
              accessibilityLabel={t.printing.create.removeItem(index + 1)}
              icon={<Icon color={colors.semantic.error} name="trash" />}
              onPress={() => onRemove(item.key)}
              size="sm"
              variant="ghost"
            />
          ) : null}
        </Stack>

        {source ? (
          <Stack align="center" direction="horizontal" gap="md">
            {source.kind === 'upload' ? (
              <Image
                accessibilityIgnoresInvertColors
                resizeMode="cover"
                source={{ uri: source.file.uri }}
                style={styles.thumb}
              />
            ) : (
              <View
                style={[styles.thumb, styles.thumbIcon, { backgroundColor: brand.primarySoft }]}
              >
                <Icon color={brand.primary} name="file" />
              </View>
            )}
            <Stack gap="xs" style={styles.sourceBody}>
              <AppText color="muted" variant="caption">
                {source.kind === 'upload'
                  ? t.printing.create.uploadSelected
                  : t.printing.library.fileLabel}
              </AppText>
              <AppText numberOfLines={2} variant="bodySmall" weight="600">
                {source.kind === 'library' ? source.title : source.file.name}
              </AppText>
              {source.kind === 'upload' && source.file.size !== null ? (
                <AppText color="muted" variant="caption">
                  {formatFileSize(source.file.size, t.files)}
                </AppText>
              ) : null}
            </Stack>
            <AppButton
              onPress={() => setSource(null)}
              size="sm"
              title={t.printing.create.changeFile}
              variant="ghost"
            />
          </Stack>
        ) : (
          <Stack gap="sm">
            <Stack direction="horizontal" gap="sm" wrap>
              <AppButton
                leftIcon={<Icon color={brand.primary} name="folder" size={18} />}
                onPress={() => setLibraryOpen(true)}
                size="sm"
                title={t.printing.create.pickFromLibrary}
                variant="outline"
              />
              <AppButton
                leftIcon={<Icon color={brand.primary} name="image" size={18} />}
                loading={isPicking}
                onPress={() => void handlePickFromDevice()}
                size="sm"
                title={t.printing.create.pickFromDevice}
                variant="outline"
              />
            </Stack>
            <AppText color="muted" variant="caption">
              {t.printing.create.uploadHint}
            </AppText>
          </Stack>
        )}

        {problemText ? (
          <AppText color="error" variant="bodySmall">
            {problemText}
          </AppText>
        ) : null}
        {showErrors && problems?.source ? (
          <AppText color="error" variant="bodySmall">
            {t.printing.create.itemMissingFile}
          </AppText>
        ) : null}

        <PrintCopiesStepper
          error={showErrors && problems?.copies ? t.printing.errors.invalidCopies : undefined}
          onChange={(copies) => onChange(item.key, { copies })}
          value={item.copies}
        />
        <PrintItemOptions item={item} onChange={(patch) => onChange(item.key, patch)} />
      </Stack>

      <PrintLibraryPicker
        onClose={() => setLibraryOpen(false)}
        onSelect={handleLibrarySelect}
        selectedId={source?.kind === 'library' ? source.id : null}
        visible={libraryOpen}
      />
    </AppCard>
  );
}

export const PrintItemCard = memo(PrintItemCardComponent);

const styles = StyleSheet.create({
  thumb: { width: THUMB_SIZE, height: THUMB_SIZE, borderRadius: radius.md },
  thumbIcon: { alignItems: 'center', justifyContent: 'center' },
  sourceBody: { flex: 1, minWidth: 0, paddingHorizontal: spacing.xs },
});
