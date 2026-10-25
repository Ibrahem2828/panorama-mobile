import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { StyleSheet, View } from 'react-native';

import { AppText } from '../../../components';
import { colors, spacing } from '../../../theme';
import { useTranslation } from '../../../i18n';
import { formatAgo } from '../../../offline/formatAgo';
import { isOnlineFromNetInfo, useNetworkStore } from '../../../offline/networkStore';

/**
 * Keeps the shared connectivity flag up to date. Mounted once at the root (the banner below renders it).
 */
function useNetworkMonitor() {
  const setOnline = useNetworkStore((state) => state.setOnline);

  useEffect(
    () => NetInfo.addEventListener((state) => setOnline(isOnlineFromNetInfo(state))),
    [setOnline],
  );
}

function useMinuteClock(active: boolean): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!active) {
      return undefined;
    }

    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 30_000);

    return () => clearInterval(timer);
  }, [active]);

  return now;
}

/**
 * One calm strip for both situations where the screen is showing saved data: the device is offline, or it is online but the
 * server could not be reached and a saved copy was shown. It names how old the data is.
 */
export function NetworkStatusBanner() {
  const { t } = useTranslation();

  useNetworkMonitor();

  const isOnline = useNetworkStore((state) => state.isOnline);
  const savedAt = useNetworkStore((state) => state.lastCachedSavedAt);
  const visible = !isOnline || savedAt !== null;
  const now = useMinuteClock(visible);

  if (!visible) {
    return null;
  }

  const age = savedAt !== null ? formatAgo(savedAt, now, t.connectivity) : null;
  const message = isOnline
    ? t.connectivity.staleSaved
    : savedAt !== null
      ? t.connectivity.offlineSaved
      : t.connectivity.offline;

  return (
    <View accessibilityLiveRegion="polite" style={[styles.banner, isOnline ? styles.stale : null]}>
      <AppText align="center" color={isOnline ? 'primary' : 'inverse'} variant="caption">
        {age ? `${message} · ${t.connectivity.lastUpdated(age)}` : message}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.gray[700],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  stale: {
    backgroundColor: colors.semantic.warning,
  },
});
