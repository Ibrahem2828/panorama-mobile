import { memo, useCallback, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { AppButton, AppCard, AppIconButton, AppText, Icon, Stack } from '../../../components';
import { useTranslation } from '../../../i18n';
import { colors, radius, spacing, useBrand } from '../../../theme';
import { formatFileSize } from '../../files/services';
import type { FileResource } from '../../files/types';
import { getFileDisplayTitle } from '../../files/services';
import { useAuthStore } from '../../auth/store';
import { isConvertibleDocument } from '../../attachments/services/localFile';
import { convertOfficeDocument } from '../services/printingService';
import { pickPrintDocument, pickPrintImage, pickPrintPhoto } from '../services/imagePicker';
import type { PrintCartItem, PrintItemValidation, PrintSource, UploadProblem } from '../types';
import { PrintCopiesStepper } from './PrintCopiesStepper';
import { PrintItemOptions } from './PrintItemOptions';
import { PrintOrderPreview } from './PrintOrderPreview';
import { PrintSheetSimulation } from './PrintSheetSimulation';
import { usePrintingStore } from '../store';
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
  const coverColor = usePrintingStore(
    (state) => state.options?.covers.find((cover) => cover.code === item.cover)?.color_hex,
  );
  // General accounts print their own uploads only; students can also pick subject files they may open.
  const isStudent = useAuthStore((state) => state.user?.role?.toLowerCase() === 'student');
  const [pickerProblem, setPickerProblem] = useState<
    UploadProblem | 'error' | 'convert' | 'camera' | null
  >(
    null,
  );
  const [isPicking, setIsPicking] = useState(false);
  const [isConverting, setIsConverting] = useState(false);

  const setSource = useCallback(
    (source: PrintSource) => onChange(item.key, { source }),
    [item.key, onChange],
  );

  async function handlePickFromDevice(picker: typeof pickPrintImage = pickPrintImage) {
    if (isPicking) {
      return;
    }

    setIsPicking(true);
    setPickerProblem(null);

    const result = await picker();

    setIsPicking(false);

    if (result.status === 'picked' && isConvertibleDocument(result.file.name)) {
      // Word/PowerPoint cannot be printed directly: the server turns the file into a PDF first.
      setIsConverting(true);

      try {
        const converted = await convertOfficeDocument(
          result.file,
          useAuthStore.getState().accessToken ?? '',
        );

        setSource({ kind: 'converted', ...converted });
      } catch {
        setPickerProblem('convert');
      } finally {
        setIsConverting(false);
      }
    } else if (result.status === 'picked') {
      setSource({ kind: 'upload', file: result.file });
    } else if (result.status === 'invalid') {
      setPickerProblem(result.problem);
    } else if (result.status === 'permission_denied') {
      setPickerProblem('camera');
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
            : pickerProblem === 'convert'
              ? t.printing.create.convertFailed
              : pickerProblem === 'camera'
                ? t.printing.create.cameraDenied
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
            {source.kind === 'product' && source.product.image_url ? (
              <Image
                accessibilityIgnoresInvertColors
                resizeMode="cover"
                source={{ uri: source.product.image_url }}
                style={styles.thumb}
              />
            ) : source.kind === 'upload' && source.file.mimeType?.startsWith('image/') ? (
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
                  : source.kind === 'converted'
                    ? t.printing.create.convertedLabel
                    : source.kind === 'product'
                      ? t.printing.products.productLabel
                      : t.printing.library.fileLabel}
              </AppText>
              <AppText numberOfLines={2} variant="bodySmall" weight="600">
                {source.kind === 'library'
                  ? source.title
                  : source.kind === 'converted'
                    ? source.name
                    : source.kind === 'product'
                      ? source.product.name
                      : source.file.name}
              </AppText>
              {source.kind === 'converted' && source.pages ? (
                <AppText color="muted" variant="caption">
                  {t.printing.create.convertedPages(source.pages)}
                </AppText>
              ) : null}
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
              {isStudent ? (
                <AppButton
                  leftIcon={<Icon color={brand.primary} name="folder" size={18} />}
                  onPress={() => setLibraryOpen(true)}
                  size="sm"
                  title={t.printing.create.pickFromLibrary}
                  variant="outline"
                />
              ) : null}
              <AppButton
                leftIcon={<Icon color={brand.primary} name="image" size={18} />}
                loading={isPicking}
                onPress={() => void handlePickFromDevice()}
                size="sm"
                title={t.printing.create.pickFromDevice}
                variant="outline"
              />
              <AppButton
                leftIcon={<Icon color={brand.primary} name="camera" size={18} />}
                loading={isPicking}
                onPress={() => void handlePickFromDevice(pickPrintPhoto)}
                size="sm"
                title={t.printing.create.pickFromCamera}
                variant="outline"
              />
              <AppButton
                leftIcon={<Icon color={brand.primary} name="file" size={18} />}
                loading={isPicking || isConverting}
                onPress={() => void handlePickFromDevice(pickPrintDocument)}
                size="sm"
                title={t.printing.create.pickPdf}
                variant="outline"
              />
            </Stack>
            {isConverting ? (
              <AppText color="secondary" variant="bodySmall">
                {t.printing.create.converting}
              </AppText>
            ) : null}
            <AppText color="muted" variant="caption">
              {isStudent ? t.printing.create.uploadHint : t.printing.create.uploadHintGeneral}
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
        {source?.kind === 'product' ? (
          <Stack gap="xs">
            <AppText color="secondary" variant="bodySmall">
              {t.printing.products.fixedSpec(source.product.pages_count, source.product.paper_size)}
            </AppText>
            <AppText color="brand" variant="title">
              {t.printing.products.fixedPrice(
                String(source.product.price),
                source.product.currency,
              )}
            </AppText>
          </Stack>
        ) : (
          <>
            <PrintSheetSimulation
              coverColor={coverColor}
              input={{
                pages:
                  source?.kind === 'converted'
                    ? source.pages
                    : source?.kind === 'upload' && source.file.mimeType?.startsWith('image/')
                      ? 1
                      : null,
                pageRange: item.pageRange,
                pagesPerSheet: item.pagesPerSheet,
                orientation: item.orientation,
                direction: item.nUpDirection,
                doubleSided: item.sides === 'double_sided',
                duplexFlip: item.duplexFlip,
                copies: item.copies,
              }}
            />
            <PrintOrderPreview
              item={{
                paperSize: item.paperSize,
                colorMode: item.colorMode,
                sides: item.sides,
                binding: item.binding,
                copies: item.copies,
              }}
              pages={item.source?.kind === 'converted' ? item.source.pages : null}
            />
            <PrintItemOptions
              item={item}
              onChange={(patch) => onChange(item.key, patch)}
              pages={item.source?.kind === 'converted' ? item.source.pages : null}
            />
            {showErrors && problems?.pageRange ? (
              <AppText color="error" variant="bodySmall">
                {t.printing.options.rangeErrors.syntax}
              </AppText>
            ) : null}
          </>
        )}
      </Stack>

      {isStudent ? (
        <PrintLibraryPicker
          onClose={() => setLibraryOpen(false)}
          onSelect={handleLibrarySelect}
          selectedId={source?.kind === 'library' ? source.id : null}
          visible={libraryOpen}
        />
      ) : null}
    </AppCard>
  );
}

export const PrintItemCard = memo(PrintItemCardComponent);

const styles = StyleSheet.create({
  thumb: { width: THUMB_SIZE, height: THUMB_SIZE, borderRadius: radius.md },
  thumbIcon: { alignItems: 'center', justifyContent: 'center' },
  sourceBody: { flex: 1, minWidth: 0, paddingHorizontal: spacing.xs },
});
