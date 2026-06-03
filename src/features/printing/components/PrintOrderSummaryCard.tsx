import { AppCard, AppText, Stack } from '../../../components';
import type { PrintDraft, PrintOrder } from '../types';
import {
  formatPrintOrderPrice,
  getPrintOrderCopiesCount,
  getPrintOrderDisplayTitle,
  getPrintOrderItemsCount,
} from '../services';

type PrintOrderSummaryCardProps = {
  draft?: PrintDraft;
  order?: PrintOrder;
};

export function PrintOrderSummaryCard({ draft, order }: PrintOrderSummaryCardProps) {
  const price = order ? formatPrintOrderPrice(order) : null;

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
            <AppText
              color={price ? 'brand' : 'muted'}
              variant="bodySmall"
              weight={price ? '600' : undefined}
            >
              {price ?? 'السعر غير متاح من الباك إند بعد.'}
            </AppText>
          </>
        ) : (
          <>
            <AppText color="secondary" variant="bodySmall">
              {draft?.sourceFileTitle ?? 'لم يتم اختيار ملف بعد.'}
            </AppText>
            <AppText color="secondary" variant="bodySmall">
              {draft?.copies ?? 1} نسخة
            </AppText>
            <AppText color="muted" variant="caption">
              لا يوجد حساب سعر في Phase 11 لأن endpoint التسعير غير ضمن نطاق التنفيذ الحالي.
            </AppText>
          </>
        )}
      </Stack>
    </AppCard>
  );
}
