import { AppButton, AppTextInput, Stack } from '../../../components';

type SupportMessageInputProps = {
  value: string;
  error?: string;
  disabled?: boolean;
  loading?: boolean;
  onChangeText: (value: string) => void;
  onSubmit: () => void;
};

export function SupportMessageInput({
  value,
  error,
  disabled = false,
  loading = false,
  onChangeText,
  onSubmit,
}: SupportMessageInputProps) {
  return (
    <Stack gap="md">
      <AppTextInput
        disabled={disabled}
        error={error}
        label="إضافة رسالة"
        multiline
        onChangeText={onChangeText}
        placeholder="اكتب تفاصيل إضافية لفريق الدعم"
        value={value}
      />
      <AppButton
        disabled={disabled || value.trim().length === 0}
        loading={loading}
        onPress={onSubmit}
        title="إرسال الرسالة"
      />
    </Stack>
  );
}
