import { StyleSheet, View } from 'react-native';

import { AppBadge, AppCard, AppText, Stack } from '../../../components';
import { colors, spacing } from '../../../theme';
import type { StatusVariant } from '../../../types/common';
import { getVerificationRejectionReason, getVerificationStatus } from '../services';
import type { VerificationRecord } from '../types';

type VerificationStatusCardProps = {
  verification: VerificationRecord | null;
};

type VerificationStatusView = {
  label: string;
  description: string;
  variant: StatusVariant;
};

function getStatusView(verification: VerificationRecord | null): VerificationStatusView {
  const status = getVerificationStatus(verification);

  switch (status) {
    case 'approved':
      return {
        label: 'موثق',
        description: 'تم قبول طلب التوثيق ويمكنك الدخول إلى خدمات التطبيق.',
        variant: 'success',
      };
    case 'pending':
      return {
        label: 'قيد المراجعة',
        description: 'تم إرسال طلبك وهو بانتظار مراجعة الإدارة.',
        variant: 'warning',
      };
    case 'rejected':
      return {
        label: 'مرفوض',
        description: 'تم رفض طلب التوثيق. راجع السبب ثم أرسل صورة محدثة.',
        variant: 'error',
      };
    case 'needs_update':
      return {
        label: 'بحاجة إلى تحديث',
        description: 'يحتاج طلبك إلى صورة أو بيانات أوضح قبل إكمال التوثيق.',
        variant: 'warning',
      };
    case 'none':
    default:
      return {
        label: 'غير مرسل',
        description: 'لم يتم إرسال طلب توثيق لهذا الحساب بعد.',
        variant: 'neutral',
      };
  }
}

export function VerificationStatusCard({ verification }: VerificationStatusCardProps) {
  const statusView = getStatusView(verification);
  const rejectionReason = getVerificationRejectionReason(verification);

  return (
    <AppCard padding="lg" variant="default">
      <Stack gap="md">
        <View style={styles.header}>
          <AppText variant="title">حالة التوثيق</AppText>
          <AppBadge label={statusView.label} size="md" variant={statusView.variant} />
        </View>

        <AppText color="secondary" variant="body">
          {statusView.description}
        </AppText>

        {rejectionReason ? (
          <View style={styles.reasonBox}>
            <Stack gap="xs">
              <AppText color="error" variant="bodySmall" weight="600">
                سبب الرفض
              </AppText>
              <AppText color="secondary" variant="bodySmall">
                {rejectionReason}
              </AppText>
            </Stack>
          </View>
        ) : null}
      </Stack>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.default,
  },
  reasonBox: {
    padding: spacing.md,
    borderRadius: 8,
    backgroundColor: colors.background.muted,
  },
});
