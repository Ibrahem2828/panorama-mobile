import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScrollView, StyleSheet, View } from 'react-native';

import {
  AppButton,
  AppCard,
  AppHeader,
  AppScreen,
  AppText,
  EmptyState,
  Stack,
} from '../../../components';
import { useTranslation } from '../../../i18n';
import { PrintingRoutes } from '../../../navigation/routes';
import type { PrintingStackParamList } from '../../../navigation/types';
import { colors, spacing } from '../../../theme';
import { PrintQuoteBreakdown, PrintStickyBar, UploadProgressCard } from '../components';
import { formatPrintMoney, hasUploads, totalCopies } from '../services';
import { isQuoteFresh, usePrintingStore } from '../store';

type Props = NativeStackScreenProps<PrintingStackParamList, 'PrintPriceSummary'>;

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <Stack align="flex-start" direction="horizontal" gap="md" justify="space-between">
      <AppText color="muted" variant="caption">
        {label}
      </AppText>
      <AppText style={styles.rowValue} variant="bodySmall" weight="600">
        {value}
      </AppText>
    </Stack>
  );
}

export function PrintPriceSummaryScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const draft = usePrintingStore((state) => state.draft);
  const quote = usePrintingStore((state) => state.quote);
  const locations = usePrintingStore((state) => state.pickupLocations);
  const transfer = usePrintingStore((state) => state.transfer);
  const isQuoting = usePrintingStore((state) => state.isQuoting);
  const isSubmitting = usePrintingStore((state) => state.isSubmitting);
  const draftError = usePrintingStore((state) => state.draftError);
  const calculateQuote = usePrintingStore((state) => state.calculateQuote);
  const createOrder = usePrintingStore((state) => state.createOrder);
  const cancelTransfer = usePrintingStore((state) => state.cancelTransfer);
  const resetDraft = usePrintingStore((state) => state.resetDraft);
  const fresh = isQuoteFresh({ quote, draft });
  const location = locations.find((entry) => String(entry.id) === String(draft.pickupLocationId));
  const busy = isQuoting || isSubmitting;
  const notes = draft.userNotes.trim();

  async function handleSubmit() {
    const order = await createOrder();

    if (order) {
      // Leave the order form behind: back from the new order lands on the printing home.
      navigation.reset({
        index: 1,
        routes: [
          { name: PrintingRoutes.PrintHome },
          { name: PrintingRoutes.PrintOrderDetails, params: { orderId: order.id } },
        ],
      });
      resetDraft();
    }
  }

  const header = (
    <Stack gap="md">
      <AppHeader
        subtitle={t.printing.priceSummary.subtitle}
        title={t.printing.priceSummary.title}
      />
      <AppButton
        disabled={busy}
        onPress={() => navigation.goBack()}
        title={t.printing.priceSummary.back}
        variant="ghost"
      />
    </Stack>
  );

  if (!quote) {
    return (
      <AppScreen contentContainerStyle={styles.content} scroll>
        {header}
        <EmptyState
          action={
            <AppButton
              onPress={() => navigation.goBack()}
              title={t.printing.priceSummary.editOptions}
              variant="outline"
            />
          }
          message={t.printing.priceSummary.empty}
          title={t.printing.priceSummary.title}
        />
      </AppScreen>
    );
  }

  const totalText = formatPrintMoney(quote.value.total_price, quote.value.currency);

  return (
    <AppScreen horizontalPadding={false} style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        style={styles.scroll}
      >
        <Stack gap="xl">
          {header}

          <AppCard variant="default">
            <Stack gap="md">
              <SummaryRow
                label={t.printing.priceSummary.totalFiles}
                value={String(draft.items.length)}
              />
              <SummaryRow
                label={t.printing.priceSummary.totalCopies}
                value={String(totalCopies(draft))}
              />
              {location ? (
                <SummaryRow label={t.printing.priceSummary.pickupSummary} value={location.name} />
              ) : null}
              {notes ? (
                <SummaryRow label={t.printing.priceSummary.notesSummary} value={notes} />
              ) : null}
            </Stack>
          </AppCard>

          {!fresh ? (
            <AppCard variant="muted">
              <Stack gap="sm">
                <AppText color="error" variant="bodySmall" weight="700">
                  {t.printing.priceSummary.staleTitle}
                </AppText>
                <AppText color="secondary" variant="bodySmall">
                  {t.printing.priceSummary.staleMessage}
                </AppText>
              </Stack>
            </AppCard>
          ) : null}

          <PrintQuoteBreakdown items={draft.items} names={quote.names} quote={quote.value} />

          <AppText color="muted" variant="caption">
            {t.printing.priceSummary.confirmNote}
          </AppText>

          {draftError ? (
            <AppCard variant="muted">
              <AppText color="error" variant="bodySmall">
                {draftError}
              </AppText>
            </AppCard>
          ) : null}
        </Stack>
      </ScrollView>

      <PrintStickyBar>
        {transfer && hasUploads(draft) ? (
          <UploadProgressCard onCancel={cancelTransfer} transfer={transfer} />
        ) : (
          <>
            <View style={styles.barRow}>
              <View style={styles.barText}>
                <AppText color="muted" variant="caption">
                  {t.printing.priceSummary.total}
                </AppText>
                <AppText color="brand" variant="h3">
                  {totalText ?? ''}
                </AppText>
              </View>
              <AppButton
                disabled={isSubmitting}
                loading={isQuoting}
                onPress={() => void calculateQuote()}
                size="sm"
                title={t.printing.priceSummary.recalculate}
                variant="ghost"
              />
            </View>
            <AppButton
              disabled={!fresh || busy}
              fullWidth
              loading={isSubmitting}
              onPress={() => void handleSubmit()}
              title={draftError ? t.printing.errors.retry : t.printing.create.submit}
            />
            <AppButton
              disabled={busy}
              fullWidth
              onPress={() => navigation.goBack()}
              size="sm"
              title={t.printing.priceSummary.editOptions}
              variant="outline"
            />
          </>
        )}
      </PrintStickyBar>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.xl },
  screen: { backgroundColor: colors.background.primary },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing.xxl },
  rowValue: { flexShrink: 1 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  barText: { flex: 1, minWidth: 0, gap: 2 },
});
