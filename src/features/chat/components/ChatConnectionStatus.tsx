import { AppBadge, AppText, Stack } from '../../../components';
import type { ChatConnectionStatus as ChatConnectionStatusValue } from '../types';

type ChatConnectionStatusProps = {
  status: ChatConnectionStatusValue;
};

function getStatusLabel(status: ChatConnectionStatusValue): string {
  switch (status) {
    case 'connecting':
      return 'جاري الاتصال';
    case 'connected':
      return 'متصل';
    case 'reconnecting':
      return 'إعادة اتصال';
    case 'error':
      return 'REST متاح';
    case 'disconnected':
      return 'غير متصل';
    default:
      return 'REST';
  }
}

export function ChatConnectionStatusIndicator({ status }: ChatConnectionStatusProps) {
  return (
    <Stack direction="horizontal" gap="sm" wrap>
      <AppBadge
        label={getStatusLabel(status)}
        variant={status === 'connected' ? 'success' : status === 'error' ? 'warning' : 'neutral'}
      />
      <AppText color="muted" variant="caption">
        تعمل المحادثة عبر REST، ويستخدم WebSocket كتحديث اختياري فقط.
      </AppText>
    </Stack>
  );
}
