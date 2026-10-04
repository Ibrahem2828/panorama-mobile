import { StyleSheet, View } from 'react-native';

import { AppBadge, AppButton, AppCard, AppText, Stack } from '../../../components';
import { useTranslation, type TranslationCatalog } from '../../../i18n';
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

function getStudentStatusView(
  {
    profileComplete,
    verificationStatus,
    hasProfileState,
    hasVerificationState,
  }: StudentStatusCardProps,
  t: TranslationCatalog['home']['studentStatus'],
): StudentStatusView {
  if (!hasProfileState || !hasVerificationState) {
    return {
      label: t.loadingLabel,
      description: t.loadingDescription,
      variant: 'neutral',
    };
  }

  if (!profileComplete) {
    return {
      label: t.incompleteLabel,
      description: t.incompleteDescription,
      variant: 'warning',
    };
  }

  switch (verificationStatus) {
    case 'approved':
      return {
        label: t.verifiedLabel,
        description: t.verifiedDescription,
        variant: 'success',
      };
    case 'pending':
      return {
        label: t.pendingLabel,
        description: t.pendingDescription,
        variant: 'warning',
      };
    case 'rejected':
      return {
        label: t.rejectedLabel,
        description: t.rejectedDescription,
        variant: 'error',
      };
    case 'needs_update':
      return {
        label: t.needsUpdateLabel,
        description: t.needsUpdateDescription,
        variant: 'warning',
      };
    default:
      return {
        label: t.unknownLabel,
        description: t.unknownDescription,
        variant: 'neutral',
      };
  }
}

export function StudentStatusCard(props: StudentStatusCardProps) {
  const { t } = useTranslation();
  const statusView = getStudentStatusView(props, t.home.studentStatus);

  return (
    <AppCard padding="lg" variant="default">
      <Stack gap="md">
        <View style={styles.header}>
          <AppText variant="title">{t.home.studentStatus.title}</AppText>
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
