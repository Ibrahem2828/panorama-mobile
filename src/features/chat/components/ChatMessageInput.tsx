import { AppButton, AppTextInput, Stack } from '../../../components';

type ChatMessageInputProps = {
  value: string;
  disabled?: boolean;
  loading?: boolean;
  error?: string | null;
  onChangeText: (value: string) => void;
  onSubmit: () => void;
  onResend?: () => void;
};

export function ChatMessageInput({
  value,
  disabled = false,
  loading = false,
  error,
  onChangeText,
  onSubmit,
  onResend,
}: ChatMessageInputProps) {
  return (
    <Stack gap="md">
      <AppTextInput
        disabled={disabled}
        error={error ?? undefined}
        maxLength={1000}
        multiline
        onChangeText={onChangeText}
        placeholder="اكتب رسالة..."
        value={value}
      />
      <Stack direction="horizontal" gap="sm" wrap>
        <AppButton
          disabled={disabled || value.trim().length === 0}
          loading={loading}
          onPress={onSubmit}
          title="إرسال"
        />
        {error && onResend ? (
          <AppButton loading={loading} onPress={onResend} title="إعادة الإرسال" variant="outline" />
        ) : null}
      </Stack>
    </Stack>
  );
}
