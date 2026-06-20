import { StyleSheet, View } from 'react-native';

import { AppBadge, AppButton, AppCard, AppText, Stack } from '../../../components';
import { colors, spacing } from '../../../theme';
import type { StatusVariant } from '../../../types/common';

type StudentStatusCardProps = {
  profileComplete: boolean;
  verificationStatus: string;
  hasProfileState: boolean;
  hasVerificationState: boolean;
  actionLabel?: string;
  onAction?: () => void;
};

type StudentStatusView = {
  label: string;
  description: string;
  variant: StatusVariant;
};

function getStudentStatusView({
  profileComplete,
  verificationStatus,
  hasProfileState,
  hasVerificationState,
}: StudentStatusCardProps): StudentStatusView {
  if (!hasProfileState || !hasVerificationState) {
    return {
      label: 'قيد التحديث',
      description: 'سيتم عرض حالة الملف والتوثيق بعد اكتمال تحميل بيانات الحساب.',
      variant: 'neutral',
    };
  }

  if (!profileComplete) {
    return {
      label: 'ملف غير مكتمل',
      description: 'أكمل بياناتك الأكاديمية للاستفادة من خدمات الطالب.',
      variant: 'warning',
    };
  }

  switch (verificationStatus) {
    case 'approved':
      return {
        label: 'حسابك موثق',
        description: 'يمكنك الآن استخدام الخدمات المخصصة للطلاب الموثقين.',
        variant: 'success',
      };
    case 'pending':
      return {
        label: 'قيد المراجعة',
        description: 'طلب التوثيق قيد المراجعة من الإدارة.',
        variant: 'warning',
      };
    case 'rejected':
      return {
        label: 'مرفوض',
        description: 'طلب التوثيق مرفوض. راجع سبب الرفض من شاشة التوثيق.',
        variant: 'error',
      };
    case 'needs_update':
      return {
        label: 'يحتاج تحديث',
        description: 'طلب التوثيق يحتاج صورة أو بيانات أوضح.',
        variant: 'warning',
      };
    default:
      return {
        label: 'أكمل بياناتك الأكاديمية',
        description: 'لم يتم تأكيد حالة التوثيق بعد.',
        variant: 'neutral',
      };
  }
}

export function StudentStatusCard(props: StudentStatusCardProps) {
  const statusView = getStudentStatusView(props);

  return (
    <AppCard padding="lg" variant="default">
      <Stack gap="md">
        <View style={styles.header}>
          <AppText variant="title">حالة الطالب</AppText>
          <AppBadge label={statusView.label} size="md" variant={statusView.variant} />
        </View>
        <AppText color="secondary" variant="bodySmall">
          {statusView.description}
        </AppText>
        {props.actionLabel && props.onAction ? (
          <AppButton onPress={props.onAction} title={props.actionLabel} variant="outline" />
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
});
