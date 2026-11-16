import { AppBadge } from '../../../components';
import { useTranslation } from '../../../i18n';
import { storeStatusPresentation } from '../services';

/** The coloured status chip of a store order. */
export function StoreStatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  const presentation = storeStatusPresentation(status, t.store.orders.status, t.common.unknown);

  return <AppBadge label={presentation.label} variant={presentation.variant} />;
}
