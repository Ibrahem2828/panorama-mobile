import { AppButton, AppTextInput, Stack } from '../../../components';

type ChatMessageInputProps = {
  value: string;
  disabled?: boolean;
  loading?: boolean;
  onChangeText: (value: string) => void;
  onSubmit: () => void;
};

export function ChatMessageInput({
  value,
  disabled = false,
  loading = false,
  onChangeText,
  onSubmit,
}: ChatMessageInputProps) {
  return (
    <Stack gap="md">
      <AppTextInput
        disabled={disabled}
        maxLength={1000}
        multiline
        onChangeText={onChangeText}
        placeholder="اكتب رسالة..."
        value={value}
      />
      <AppButton
        disabled={disabled || value.trim().length === 0}
        loading={loading}
        onPress={onSubmit}
        title="إرسال"
      />
    </Stack>
  );
}
