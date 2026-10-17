import type { ArtworkKey } from '../../../components';
import type { PrintOrderStatus } from '../types';

export function getPrintOrderStatusArtwork(status: PrintOrderStatus): ArtworkKey {
  switch (status) {
    case 'submitted':
    case 'pending':
    case 'accepted':
      return 'printingPending';
    case 'in_progress':
    case 'printing':
      return 'printingProcessing';
    case 'ready':
    case 'ready_for_pickup':
      return 'printingReady';
    case 'delivered':
      return 'printingCompleted';
    case 'cancelled':
    case 'canceled':
    case 'rejected':
      return 'printingCancelled';
    default:
      return 'printingPending';
  }
}
