import { AppCard, AppText, Stack } from '../../../components';
import type { PrintDraft, PrintOrder, PrintQuote } from '../types';
import {
  formatPrintOrderPrice,
  getPrintOrderCopiesCount,
  getPrintOrderDisplayTitle,
  getPrintOrderItemsCount,
} from '../services';

type Props = { draft?: PrintDraft; order?: PrintOrder; quote?: PrintQuote | null };

export function PrintOrderSummaryCard({ draft, order, quote }: Props) {
  const price = order
    ? formatPrintOrderPrice(order)
    : quote
      ? `${quote.total_price} ${quote.currency}`
      : null;
  return (
    <AppCard variant="outlined">
      <Stack gap="sm">
        <AppText variant="title">ملخص الطلب</AppText>
        {order ? (
          <>
            <AppText color="secondary" variant="bodySmall">
              {getPrintOrderDisplayTitle(order)}
            </AppText>
            <AppText color="secondary" variant="bodySmall">
              {getPrintOrderItemsCount(order)} ملف - {getPrintOrderCopiesCount(order)} نسخة
            </AppText>
          </>
        ) : (
          <>
            <AppText color="secondary" variant="bodySmall">
              {draft?.sourceFileTitle ?? 'لم يتم اختيار ملف.'}
            </AppText>
            <AppText color="secondary" variant="bodySmall">
              {draft?.copies ?? 1} نسخة · {draft?.paperSize.toUpperCase()} ·{' '}
              {draft?.sides === 'double' ? 'وجهان' : 'وجه واحد'}
            </AppText>
          </>
        )}
        <AppText color={price ? 'brand' : 'muted'} variant="title">
          {price ?? 'احسب السعر من الخادم قبل الإرسال'}
        </AppText>
      </Stack>
    </AppCard>
  );
}
