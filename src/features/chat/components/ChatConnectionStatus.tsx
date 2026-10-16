import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Stack } from '../../../components';
import { colors, radius } from '../../../theme';
import { useTranslation } from '../../../i18n';
import type { ChatConnectionStatus as ChatConnectionStatusValue } from '../types';

type ChatConnectionStatusProps = {
  status: ChatConnectionStatusValue;
  isOnline: boolean;
};

type DisplayState = 'connected' | 'connecting' | 'reconnecting' | 'offline';

/** Collapses the transport states into the three things a student cares about. */
export function getDisplayState(
  status: ChatConnectionStatusValue,
  isOnline: boolean,
): DisplayState {
  if (!isOnline) {
    return 'offline';
  }

  switch (status) {
    case 'connected':
      return 'connected';
    case 'idle':
    case 'connecting':
      return 'connecting';
    default:
      return 'reconnecting';
  }
}

const DOT_COLORS: Record<DisplayState, string> = {
  connected: colors.semantic.success,
  connecting: colors.semantic.warning,
  reconnecting: colors.semantic.warning,
  offline: colors.semantic.error,
};

/** Small dot + label: "متصل" / "جاري إعادة الاتصال…" / "غير متصل". */
export const ChatConnectionStatusLine = memo(function ChatConnectionStatusLine({
  status,
  isOnline,
}: ChatConnectionStatusProps) {
  const { t } = useTranslation();
  const state = getDisplayState(status, isOnline);
  const label =
    state === 'connected'
      ? t.chat.connection.connected
      : state === 'offline'
        ? t.chat.connection.offline
        : state === 'connecting'
          ? t.chat.connection.connecting
          : t.chat.connection.reconnecting;

  return (
    <Stack align="center" direction="horizontal" gap="xs">
      <View style={[styles.dot, { backgroundColor: DOT_COLORS[state] }]} />
      <AppText accessibilityLiveRegion="polite" color="muted" variant="caption">
        {label}
      </AppText>
    </Stack>
  );
});

const styles = StyleSheet.create({
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
  },
});
