import { StyleSheet, View } from 'react-native';

import { AppCard, AppText, Divider, Stack } from '../../../components';
import { useTranslation } from '../../../i18n';
import { formatDateTime } from '../../../utils/formatDateTime';
import { radius, spacing, useBrand } from '../../../theme';
import { formatPrintMoney, formatRounding } from '../services';
import type { PrintCartItem, PrintQuote } from '../types';
import { usePrintOptionLabels } from './PrintItemOptions';
import { PrintOrderPreview } from './PrintOrderPreview';

type PrintQuoteBreakdownProps = {
  quote: PrintQuote;
  items: PrintCartItem[];
  names: string[];
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <Stack align="center" direction="horizontal" gap="md" justify="space-between">
      <AppText color="muted" variant="caption">
        {label}
      </AppText>
      <AppText variant="bodySmall" weight="600">
        {value}
      </AppText>
    </Stack>
  );
}

/** Per-file price lines followed by the total, exactly as the server quoted them. */
export function PrintQuoteBreakdown({ quote, items, names }: PrintQuoteBreakdownProps) {
  const { t, locale } = useTranslation();
  const brand = useBrand();
  const labels = usePrintOptionLabels();
  const money = (value: string | number, currency: string) =>
    formatPrintMoney(value, currency) ?? String(value);
  const calculatedAt = formatDateTime(quote.calculated_at, locale);
  const rounding = formatRounding(quote.rounding_adjustment, quote.currency);

  return (
    <Stack gap="md">
      <AppText variant="title">{t.printing.priceSummary.linesTitle}</AppText>
      {items.map((item, index) => {
        const line = quote.items[index];

        return (
          <AppCard key={item.key} variant="default">
            <Stack gap="sm">
              <AppText variant="bodySmall" weight="700">
                {t.printing.priceSummary.quoteLine(index + 1)}
              </AppText>
              <AppText color="secondary" numberOfLines={2} variant="caption">
                {names[index]}
              </AppText>
              <PrintOrderPreview item={item} pages={line?.pages_count} />
              <Divider />
              <Row label={t.printing.priceSummary.copiesSummary} value={String(item.copies)} />
              <Row
                label={t.printing.priceSummary.optionsSummary}
                value={[item.colorMode, item.paperSize, item.sides, item.binding]
                  .map((value) => labels[value] ?? value)
                  .join(' · ')}
              />
              {line ? (
                <>
                  <Row label={t.printing.priceSummary.pages} value={String(line.pages_count)} />
                  {line.pricing_snapshot?.selected_pages &&
                  line.pricing_snapshot.selected_pages !== line.pages_count ? (
                    <Row
                      label={t.printing.priceSummary.selectedPages}
                      value={String(line.pricing_snapshot.selected_pages)}
                    />
                  ) : null}
                  {item.pagesPerSheet > 1 ? (
                    <Row
                      label={t.printing.priceSummary.perSheet}
                      value={String(item.pagesPerSheet)}
                    />
                  ) : null}
                  <Row label={t.printing.priceSummary.sheets} value={String(line.sheets_count)} />
                  <Row
                    label={t.printing.priceSummary.unitPrice}
                    value={money(line.unit_price, line.currency)}
                  />
                  <Row
                    label={t.printing.priceSummary.bindingPrice}
                    value={money(line.binding_price, line.currency)}
                  />
                  {line.pricing_snapshot?.wire_grams_per_copy ? (
                    <Row
                      label={t.printing.priceSummary.wire}
                      value={`${line.pricing_snapshot.wire_grams_per_copy} g`}
                    />
                  ) : null}
                  {line.pricing_snapshot?.cover_price_per_copy &&
                  Number(line.pricing_snapshot.cover_price_per_copy) > 0 ? (
                    <Row
                      label={t.printing.priceSummary.coverPrice}
                      value={money(line.pricing_snapshot.cover_price_per_copy, line.currency)}
                    />
                  ) : null}
                  <Row
                    label={t.printing.priceSummary.subtotal}
                    value={money(line.subtotal, line.currency)}
                  />
                </>
              ) : null}
            </Stack>
          </AppCard>
        );
      })}

      {rounding ? (
        <AppCard variant="muted">
          <Row label={t.printing.priceSummary.rounding} value={rounding} />
          <AppText color="muted" variant="caption">
            {t.printing.priceSummary.roundingNote}
          </AppText>
        </AppCard>
      ) : null}

      <View style={[styles.total, { backgroundColor: brand.primarySoft }]}>
        <Stack align="center" direction="horizontal" gap="md" justify="space-between">
          <AppText variant="title">{t.printing.priceSummary.total}</AppText>
          <AppText color="brand" variant="h3">
            {money(quote.total_price, quote.currency)}
          </AppText>
        </Stack>
        {calculatedAt ? (
          <AppText color="muted" variant="caption">
            {t.printing.priceSummary.calculatedAt(calculatedAt)}
          </AppText>
        ) : null}
      </View>
    </Stack>
  );
}

const styles = StyleSheet.create({
  total: { borderRadius: radius.card, padding: spacing.lg, gap: spacing.xs },
});
