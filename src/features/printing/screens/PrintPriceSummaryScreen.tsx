import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet } from 'react-native';
import { AppButton, AppHeader, AppScreen, ErrorState, Stack } from '../../../components';
import { useTranslation } from '../../../i18n';
import type { PrintingStackParamList } from '../../../navigation/types';
import { spacing } from '../../../theme';
import { PrintOrderSummaryCard } from '../components';
import { usePrintingStore } from '../store';

type Props = NativeStackScreenProps<PrintingStackParamList, 'PrintPriceSummary'>;
export function PrintPriceSummaryScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const draft = usePrintingStore((state) => state.draft);
  const quote = usePrintingStore((state) => state.quote);
  const isQuoting = usePrintingStore((state) => state.isQuoting);
  const error = usePrintingStore((state) => state.errorMessage);
  const calculate = usePrintingStore((state) => state.calculateQuote);
  return (
    <AppScreen contentContainerStyle={styles.content} scroll>
      <Stack gap="xl">
        <AppHeader
          subtitle={t.printing.priceSummary.subtitle}
          title={t.printing.priceSummary.title}
        />
        <AppButton onPress={() => navigation.goBack()} title={t.common.back} variant="ghost" />
        {error ? <ErrorState message={error} /> : null}
        <PrintOrderSummaryCard draft={draft} quote={quote} />
        <AppButton
          loading={isQuoting}
          onPress={() => void calculate()}
          title={t.printing.priceSummary.recalculate}
        />
      </Stack>
    </AppScreen>
  );
}
const styles = StyleSheet.create({ content: { gap: spacing.xl } });
