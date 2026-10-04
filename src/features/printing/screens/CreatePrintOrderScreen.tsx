import { useEffect } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet } from 'react-native';

import {
  AppButton,
  AppCard,
  AppHeader,
  AppScreen,
  AppText,
  AppTextInput,
  ErrorState,
  LoadingState,
  Stack,
} from '../../../components';
import { useTranslation } from '../../../i18n';
import { PrintingRoutes } from '../../../navigation/routes';
import type { PrintingStackParamList } from '../../../navigation/types';
import { spacing } from '../../../theme';
import { getFileDisplayTitle } from '../../files/services';
import { useFilesStore } from '../../files/store';
import type { FileResource } from '../../files/types';
import {
  PrintCopiesStepper,
  PrintFileSelector,
  PrintOptionsCard,
  PrintOrderSummaryCard,
} from '../components';
import { usePrintingStore } from '../store';

type Props = NativeStackScreenProps<PrintingStackParamList, 'CreatePrintOrder'>;

export function CreatePrintOrderScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const files = useFilesStore((state) => state.files).filter((file) => file.is_printable !== false);
  const isLoadingFiles = useFilesStore((state) => state.isLoadingFiles);
  const filesError = useFilesStore((state) => state.errorMessage);
  const loadFiles = useFilesStore((state) => state.loadFiles);
  const refreshFiles = useFilesStore((state) => state.refreshFiles);
  const draft = usePrintingStore((state) => state.draft);
  const validation = usePrintingStore((state) => state.validation);
  const quote = usePrintingStore((state) => state.quote);
  const locations = usePrintingStore((state) => state.pickupLocations);
  const isSubmitting = usePrintingStore((state) => state.isSubmitting);
  const isQuoting = usePrintingStore((state) => state.isQuoting);
  const error = usePrintingStore((state) => state.errorMessage);
  const setDraftFile = usePrintingStore((state) => state.setDraftFile);
  const setDraftNotes = usePrintingStore((state) => state.setDraftNotes);
  const setDraftOption = usePrintingStore((state) => state.setDraftOption);
  const incrementCopies = usePrintingStore((state) => state.incrementCopies);
  const decrementCopies = usePrintingStore((state) => state.decrementCopies);
  const calculateQuote = usePrintingStore((state) => state.calculateQuote);
  const createOrder = usePrintingStore((state) => state.createOrder);
  const loadConfiguration = usePrintingStore((state) => state.loadPrintingConfiguration);

  useEffect(() => {
    void loadFiles();
    void loadConfiguration();
  }, [loadConfiguration, loadFiles]);
  useEffect(() => {
    if (route.params?.fileId !== undefined)
      setDraftFile(route.params.fileId, route.params.fileTitle ?? null);
  }, [route.params?.fileId, route.params?.fileTitle, setDraftFile]);

  async function handleSubmit() {
    const order = await createOrder();
    if (order) navigation.replace(PrintingRoutes.PrintOrderDetails, { orderId: order.id });
  }

  return (
    <AppScreen contentContainerStyle={styles.content} scroll>
      <Stack gap="xl">
        <AppHeader subtitle={t.printing.create.subtitle} title={t.printing.create.title} />
        <AppButton onPress={() => navigation.goBack()} title={t.common.back} variant="ghost" />
        {isLoadingFiles && files.length === 0 ? (
          <LoadingState message={t.printing.create.loadingFiles} />
        ) : null}
        {filesError ? <ErrorState message={filesError} onRetry={refreshFiles} /> : null}
        {error ? <ErrorState message={error} /> : null}

        <PrintFileSelector
          error={validation.sourceFileId}
          files={files}
          isLoading={isLoadingFiles}
          onRefresh={refreshFiles}
          onSelectFile={(file: FileResource) =>
            setDraftFile(file.id, getFileDisplayTitle(file, t.files))
          }
          selectedFileId={draft.sourceFileId}
          selectedFileTitle={draft.sourceFileTitle}
        />
        <PrintCopiesStepper
          error={validation.copies}
          onDecrement={decrementCopies}
          onIncrement={incrementCopies}
          value={draft.copies}
        />
        <PrintOptionsCard draft={draft} locations={locations} onChange={setDraftOption} />
        <AppTextInput
          helperText={t.printing.create.notesHelper}
          label={t.printing.create.notesLabel}
          maxLength={2000}
          multiline
          onChangeText={setDraftNotes}
          placeholder={t.printing.create.notesPlaceholder}
          value={draft.userNotes}
        />

        <PrintOrderSummaryCard draft={draft} quote={quote} />
        {!quote ? (
          <AppCard variant="muted">
            <AppText color="secondary" variant="caption">
              {t.printing.create.pricingNotice}
            </AppText>
          </AppCard>
        ) : null}

        <Stack direction="horizontal" gap="md" wrap>
          <AppButton
            loading={isQuoting}
            onPress={() => void calculateQuote()}
            title={t.printing.create.calculatePrice}
            variant="outline"
          />
          <AppButton
            disabled={!quote}
            loading={isSubmitting}
            onPress={() => void handleSubmit()}
            title={t.printing.create.submit}
          />
        </Stack>
      </Stack>
    </AppScreen>
  );
}

const styles = StyleSheet.create({ content: { gap: spacing.xl } });
