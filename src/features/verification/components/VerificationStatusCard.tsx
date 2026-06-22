import { StyleSheet, View } from 'react-native';

import { images } from '../../../assets/images';
import { AppBadge, AppCard, AppText, Illustration, Stack } from '../../../components';
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
        description: 'تم قبول طلب التوثيق. يمكنك الآن استخدام خدمات التطبيق للطلاب.',
        variant: 'success',
      };
    case 'pending':
      return {
        label: 'قيد المراجعة',
        description:
          'طلبك قيد المراجعة من الإدارة. لا حاجة لإعادة الإرسال إلا إذا طُلب منك ذلك صراحة.',
        variant: 'warning',
      };
    case 'rejected':
      return {
        label: 'مرفوض',
        description: 'تم رفض طلب التوثيق. راجع السبب أدناه ثم أرسل صورة محدثة وواضحة.',
        variant: 'error',
      };
    case 'needs_update':
      return {
        label: 'بحاجة إلى تحديث',
        description: 'يحتاج طلبك إلى صورة أو بيانات أوضح. أرسل بطاقة طالب محدثة.',
        variant: 'warning',
      };
    case 'none':
    default:
      return {
        label: 'غير مرسل',
        description:
          'لم يتم إرسال طلب توثيق بعد. التوثيق مطلوب للوصول إلى المجموعات والملفات والخدمات الطلابية.',
        variant: 'neutral',
      };
  }
}

export function VerificationStatusCard({ verification }: VerificationStatusCardProps) {
  const statusView = getStatusView(verification);
  const rejectionReason = getVerificationRejectionReason(verification);
  const status = getVerificationStatus(verification);
  const illustration =
    status === 'approved'
      ? images.verification.approved
      : status === 'pending'
        ? images.verification.pending
        : status === 'rejected' || status === 'needs_update'
          ? images.verification.rejected
          : images.verification.studentCardGuide;

  return (
    <AppCard padding="lg" variant="default">
      <Stack gap="md">
        <Illustration accessibilityLabel="رسم يوضح حالة التوثيق" size="lg" source={illustration} />

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
                سبب الرفض أو الملاحظة
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
