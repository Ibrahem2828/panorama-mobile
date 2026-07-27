import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet } from 'react-native';
import { AppButton, AppHeader, AppScreen, ErrorState, Stack } from '../../../components';
import type { PrintingStackParamList } from '../../../navigation/types';
import { spacing } from '../../../theme';
import { PrintOrderSummaryCard } from '../components';
import { usePrintingStore } from '../store';

type Props = NativeStackScreenProps<PrintingStackParamList, 'PrintPriceSummary'>;
export function PrintPriceSummaryScreen({ navigation }: Props) {
  const draft = usePrintingStore((state) => state.draft);
  const quote = usePrintingStore((state) => state.quote);
  const isQuoting = usePrintingStore((state) => state.isQuoting);
  const error = usePrintingStore((state) => state.errorMessage);
  const calculate = usePrintingStore((state) => state.calculateQuote);
  return (
    <AppScreen contentContainerStyle={styles.content} scroll>
      <Stack gap="xl">
        <AppHeader subtitle="تسعير صادر من الباك إند" title="ملخص السعر" />
        <AppButton onPress={() => navigation.goBack()} title="رجوع" variant="ghost" />
        {error ? <ErrorState message={error} /> : null}
        <PrintOrderSummaryCard draft={draft} quote={quote} />
        <AppButton loading={isQuoting} onPress={() => void calculate()} title="إعادة حساب السعر" />
      </Stack>
    </AppScreen>
  );
}
const styles = StyleSheet.create({ content: { gap: spacing.xl } });
