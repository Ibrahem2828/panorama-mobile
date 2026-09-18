import { AppCard, AppText, Stack } from '../../../components';
import { useTranslation } from '../../../i18n';
import type { PrintDraft, PrintOrder, PrintQuote } from '../types';
import {
  formatPrintOrderPrice,
  getPrintOrderCopiesCount,
  getPrintOrderDisplayTitle,
  getPrintOrderItemsCount,
} from '../services';

type Props = { draft?: PrintDraft; order?: PrintOrder; quote?: PrintQuote | null };

export function PrintOrderSummaryCard({ draft, order, quote }: Props) {
  const { t } = useTranslation();
  const price = order
    ? formatPrintOrderPrice(order)
    : quote
      ? `${quote.total_price} ${quote.currency}`
      : null;
  return (
    <AppCard variant="outlined">
      <Stack gap="sm">
        <AppText variant="title">{t.printing.summaryCard.title}</AppText>
        {order ? (
          <>
            <AppText color="secondary" variant="bodySmall">
              {getPrintOrderDisplayTitle(order, t.printing)}
            </AppText>
            <AppText color="secondary" variant="bodySmall">
              {t.printing.summaryCard.filesAndCopies(
                getPrintOrderItemsCount(order),
                getPrintOrderCopiesCount(order),
              )}
            </AppText>
          </>
        ) : (
          <>
            <AppText color="secondary" variant="bodySmall">
              {draft?.sourceFileTitle ?? t.printing.summaryCard.noFileSelected}
            </AppText>
            <AppText color="secondary" variant="bodySmall">
              {t.printing.summaryCard.draftLine(
                draft?.copies ?? 1,
                draft?.paperSize.toUpperCase() ?? '',
                draft?.sides === 'double'
                  ? t.printing.options.sidesDouble
                  : t.printing.options.sidesSingle,
              )}
            </AppText>
          </>
        )}
        <AppText color={price ? 'brand' : 'muted'} variant="title">
          {price ?? t.printing.summaryCard.pricePlaceholder}
        </AppText>
      </Stack>
    </AppCard>
  );
}
