import { AppButton, AppCard, AppText, Stack } from '../../../components';

type AccountSecurityCardProps = {
  onChangePassword: () => void;
};

export function AccountSecurityCard({ onChangePassword }: AccountSecurityCardProps) {
  return (
    <AppCard variant="muted">
      <Stack gap="md">
        <Stack gap="xs">
          <AppText variant="title">الحساب والأمان</AppText>
          <AppText color="secondary" variant="bodySmall">
            كلمة المرور تدار من الخادم، ولا يتم حفظها داخل التطبيق.
          </AppText>
        </Stack>
        <AppButton onPress={onChangePassword} title="تغيير كلمة المرور" variant="outline" />
      </Stack>
    </AppCard>
  );
}
