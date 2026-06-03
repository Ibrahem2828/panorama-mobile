import { AppBadge } from '../../../components';
import { getPrintOrderStatusPresentation } from '../services';
import type { PrintOrderStatus } from '../types';

type PrintOrderStatusBadgeProps = {
  status: PrintOrderStatus;
};

export function PrintOrderStatusBadge({ status }: PrintOrderStatusBadgeProps) {
  const presentation = getPrintOrderStatusPresentation(status);

  return <AppBadge label={presentation.label} variant={presentation.variant} />;
}
