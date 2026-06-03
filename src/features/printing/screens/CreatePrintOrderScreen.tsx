import { useEffect } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet } from 'react-native';

import {
  AppButton,
  AppHeader,
  AppScreen,
  AppText,
  AppTextInput,
  ErrorState,
  LoadingState,
  Stack,
} from '../../../components';
import { PrintingRoutes } from '../../../navigation/routes';
import type { PrintingStackParamList } from '../../../navigation/types';
import { spacing } from '../../../theme';
import { getFileDisplayTitle } from '../../files/services';
import { useFilesStore } from '../../files/store';
import type { FileResource } from '../../files/types';
import {
  PrintCopiesStepper,
  PrintFileSelector,
  PrintOrderSummaryCard,
  PrintingFutureOptionsCard,
} from '../components';
import { usePrintingStore } from '../store';

type CreatePrintOrderScreenProps = NativeStackScreenProps<
  PrintingStackParamList,
  'CreatePrintOrder'
>;

export function CreatePrintOrderScreen({ navigation, route }: CreatePrintOrderScreenProps) {
  const routeFileId = route.params?.fileId;
  const routeFileTitle = route.params?.fileTitle;
  const files = useFilesStore((state) => state.files);
  const isLoadingFiles = useFilesStore((state) => state.isLoadingFiles);
  const filesErrorMessage = useFilesStore((state) => state.errorMessage);
  const loadFiles = useFilesStore((state) => state.loadFiles);
  const refreshFiles = useFilesStore((state) => state.refreshFiles);
  const draft = usePrintingStore((state) => state.draft);
  const validation = usePrintingStore((state) => state.validation);
  const isSubmitting = usePrintingStore((state) => state.isSubmitting);
  const errorMessage = usePrintingStore((state) => state.errorMessage);
  const setDraftFile = usePrintingStore((state) => state.setDraftFile);
  const setDraftNotes = usePrintingStore((state) => state.setDraftNotes);
  const incrementCopies = usePrintingStore((state) => state.incrementCopies);
  const decrementCopies = usePrintingStore((state) => state.decrementCopies);
  const createOrder = usePrintingStore((state) => state.createOrder);

  useEffect(() => {
    void loadFiles();
  }, [loadFiles]);

  useEffect(() => {
    if (routeFileId !== undefined) {
      setDraftFile(routeFileId, routeFileTitle ?? null);
    }
  }, [routeFileId, routeFileTitle, setDraftFile]);

  function handleSelectFile(file: FileResource) {
    setDraftFile(file.id, getFileDisplayTitle(file));
  }

  async function handleSubmit() {
    const order = await createOrder();

    if (order) {
      navigation.navigate(PrintingRoutes.PrintOrderDetails, {
        orderId: order.id,
      });
    }
  }

  return (
    <AppScreen contentContainerStyle={styles.content} scroll>
      <Stack gap="xl">
        <Stack gap="md">
          <AppHeader subtitle="طلب طباعة جديد" title="إنشاء طلب" />
          <AppButton onPress={() => navigation.goBack()} title="رجوع" variant="ghost" />
        </Stack>

        {isLoadingFiles && files.length === 0 ? (
          <LoadingState message="جاري تحميل الملفات المتاحة..." />
        ) : null}

        {filesErrorMessage ? (
          <ErrorState message={filesErrorMessage} onRetry={refreshFiles} />
        ) : null}
        {errorMessage ? <ErrorState message={errorMessage} /> : null}

        <PrintFileSelector
          error={validation.sourceFileId}
          files={files}
          isLoading={isLoadingFiles}
          onRefresh={refreshFiles}
          onSelectFile={handleSelectFile}
          selectedFileId={draft.sourceFileId}
          selectedFileTitle={draft.sourceFileTitle}
        />

        <PrintCopiesStepper
          error={validation.copies}
          onDecrement={decrementCopies}
          onIncrement={incrementCopies}
          value={draft.copies}
        />

        <AppTextInput
          helperText="الملاحظات اختيارية وترسل كحقل user_notes فقط."
          label="ملاحظات للطلب"
          multiline
          onChangeText={setDraftNotes}
          placeholder="مثال: الرجاء التدبيس إن كان متاحا"
          value={draft.userNotes}
        />

        <PrintingFutureOptionsCard />
        <PrintOrderSummaryCard draft={draft} />

        <Stack direction="horizontal" gap="md" wrap>
          <AppButton loading={isSubmitting} onPress={handleSubmit} title="إرسال طلب الطباعة" />
          <AppButton
            onPress={() => navigation.navigate(PrintingRoutes.PrintPriceSummary)}
            title="مراجعة الملخص"
            variant="outline"
          />
        </Stack>

        <AppText color="muted" variant="caption">
          سيتم إرسال source_file وcopies وuser_notes فقط حسب API الرسمي.
        </AppText>
      </Stack>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
  },
});
