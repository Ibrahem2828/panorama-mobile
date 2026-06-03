import { AppBadge } from '../../../components';
import type { GroupMembershipStatus } from '../types';

type GroupMembershipBadgeProps = {
  status?: GroupMembershipStatus | null;
};

function getMembershipLabel(status?: GroupMembershipStatus | null): string {
  switch (status) {
    case 'pending':
      return 'بانتظار الموافقة';
    case 'approved':
      return 'عضو';
    case 'rejected':
      return 'مرفوض';
    case 'blocked':
      return 'محظور';
    case 'left':
      return 'غادرت';
    case 'none':
    case undefined:
    case null:
      return 'غير منضم';
    default:
      return 'حالة عضوية';
  }
}

function getMembershipVariant(status?: GroupMembershipStatus | null) {
  switch (status) {
    case 'approved':
      return 'success' as const;
    case 'pending':
      return 'warning' as const;
    case 'rejected':
    case 'blocked':
      return 'error' as const;
    case 'left':
      return 'neutral' as const;
    default:
      return 'info' as const;
  }
}

export function GroupMembershipBadge({ status }: GroupMembershipBadgeProps) {
  return (
    <AppBadge label={getMembershipLabel(status)} size="sm" variant={getMembershipVariant(status)} />
  );
}
