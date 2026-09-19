import { AppButton, AppTextInput, Stack } from '../../../components';
import { useTranslation } from '../../../i18n';

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
  const { t } = useTranslation();
  return (
    <Stack gap="md">
      <AppTextInput
        disabled={disabled}
        error={error ?? undefined}
        maxLength={1000}
        multiline
        onChangeText={onChangeText}
        placeholder={t.chat.inputPlaceholder}
        value={value}
      />
      <Stack direction="horizontal" gap="sm" wrap>
        <AppButton
          disabled={disabled || value.trim().length === 0}
          loading={loading}
          onPress={onSubmit}
          title={t.chat.send}
        />
        {error && onResend ? (
          <AppButton loading={loading} onPress={onResend} title={t.chat.resend} variant="outline" />
        ) : null}
      </Stack>
    </Stack>
  );
}
