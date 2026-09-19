import { AppBadge, AppText, Stack } from '../../../components';
import type { ChatConnectionStatus as ChatConnectionStatusValue } from '../types';
import { useTranslation, type TranslationCatalog } from '../../../i18n';

type ChatConnectionStatusProps = {
  status: ChatConnectionStatusValue;
};

function getStatusLabel(status: ChatConnectionStatusValue, t: TranslationCatalog): string {
  switch (status) {
    case 'connecting':
      return t.chat.connection.connecting;
    case 'connected':
      return t.chat.connection.connected;
    case 'reconnecting':
      return t.chat.connection.reconnecting;
    case 'error':
      return t.chat.connection.restAvailable;
    case 'disconnected':
      return t.chat.connection.offline;
    default:
      return 'REST';
  }
}

export function ChatConnectionStatusIndicator({ status }: ChatConnectionStatusProps) {
  const { t } = useTranslation();
  return (
    <Stack direction="horizontal" gap="sm" wrap>
      <AppBadge
        label={getStatusLabel(status, t)}
        variant={status === 'connected' ? 'success' : status === 'error' ? 'warning' : 'neutral'}
      />
      <AppText color="muted" variant="caption">
        {t.chat.connection.note}
      </AppText>
    </Stack>
  );
}
