import { AppBadge } from '../../../components';
import { useTranslation } from '../../../i18n';
import { getPrintOrderStatusPresentation } from '../services';
import type { PrintOrderStatus } from '../types';

type PrintOrderStatusBadgeProps = {
  status: PrintOrderStatus;
};

export function PrintOrderStatusBadge({ status }: PrintOrderStatusBadgeProps) {
  const { t } = useTranslation();
  const presentation = getPrintOrderStatusPresentation(status, t.printing, t.common.unknown);

  return <AppBadge label={presentation.label} variant={presentation.variant} />;
}
