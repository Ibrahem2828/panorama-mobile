import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet } from 'react-native';

import { AppButton, AppHeader, AppScreen, AppText, Stack } from '../../../components';
import { PrintingRoutes } from '../../../navigation/routes';
import type { PrintingStackParamList } from '../../../navigation/types';
import { spacing } from '../../../theme';
import { PrintOrderSummaryCard, PrintingFutureOptionsCard } from '../components';
import { usePrintingStore } from '../store';

type PrintPriceSummaryScreenProps = NativeStackScreenProps<
  PrintingStackParamList,
  'PrintPriceSummary'
>;

export function PrintPriceSummaryScreen({ navigation }: PrintPriceSummaryScreenProps) {
  const draft = usePrintingStore((state) => state.draft);

  return (
    <AppScreen contentContainerStyle={styles.content} scroll>
      <Stack gap="xl">
        <Stack gap="md">
          <AppHeader subtitle="مراجعة قبل الإرسال" title="ملخص السعر" />
          <AppButton onPress={() => navigation.goBack()} title="رجوع" variant="ghost" />
        </Stack>

        <PrintOrderSummaryCard draft={draft} />
        <PrintingFutureOptionsCard />

        <AppText color="secondary" variant="bodySmall">
          لا يتم حساب السعر في هذه المرحلة لأن endpoint التسعير ليس ضمن Phase 11. يتم عرض أي سعر فقط
          إذا أعاده الباك إند مع تفاصيل الطلب بعد الإنشاء.
        </AppText>

        <AppButton
          onPress={() => navigation.navigate(PrintingRoutes.CreatePrintOrder)}
          title="تعديل الطلب"
          variant="outline"
        />
      </Stack>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
  },
});
