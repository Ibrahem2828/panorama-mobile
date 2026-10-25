import { useCallback, useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { AppState, Linking, StyleSheet, View } from 'react-native';

import { AppButton, AppText } from '../../../components/common';
import { AppScreen } from '../../../components/layout';
import { useLocaleStore } from '../../../i18n';
import { colors, spacing } from '../../../theme';
import { getMaintenancePollIntervalMs, useLifecycleStore } from '../store/lifecycleStore';
import { resolveStoreUrl } from '../utils/storeUrl';
import { AppModal } from '../../../components/overlay';

const noop = () => undefined;

function useMaintenanceRecovery(isActive: boolean, intervalMs: number) {
  const recheck = useLifecycleStore((state) => state.recheck);

  useEffect(() => {
    if (!isActive) {
      return undefined;
    }

    const timer = setInterval(() => void recheck(), intervalMs);
    const appStateSubscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void recheck();
    });
    const unsubscribeNetInfo = NetInfo.addEventListener((state) => {
      if (state.isConnected && state.isInternetReachable !== false) void recheck();
    });

    return () => {
      clearInterval(timer);
      appStateSubscription.remove();
      unsubscribeNetInfo();
    };
  }, [intervalMs, isActive, recheck]);
}

function MaintenanceScreen() {
  const maintenance = useLifecycleStore((state) => state.maintenance);
  const isChecking = useLifecycleStore((state) => state.isChecking);
  const lastProbeResult = useLifecycleStore((state) => state.lastProbeResult);
  const recheck = useLifecycleStore((state) => state.recheck);
  const locale = useLocaleStore((state) => state.locale);
  const t = useLocaleStore((state) => state.t.lifecycle);
  const isArabic = locale === 'ar';
  const title = (isArabic ? maintenance?.titleAr : maintenance?.titleEn) || t.maintenanceTitle;
  const message =
    (isArabic ? maintenance?.messageAr : maintenance?.messageEn) || t.maintenanceMessage;
  const endAt = maintenance?.estimatedEndAt ? new Date(maintenance.estimatedEndAt) : null;
  const estimatedEnd =
    endAt && !Number.isNaN(endAt.getTime())
      ? t.maintenanceEstimatedEnd(endAt.toLocaleString(isArabic ? 'ar' : 'en'))
      : null;
  const status = isChecking
    ? t.checking
    : lastProbeResult === 'failed'
      ? t.checkFailed
      : lastProbeResult === 'still_down'
        ? t.stillDown
        : null;

  useMaintenanceRecovery(true, getMaintenancePollIntervalMs(maintenance));

  return (
    <AppScreen>
      <View style={styles.content}>
        <AppText align="center" variant="title">
          {title}
        </AppText>
        <AppText align="center" color="secondary" variant="body">
          {message}
        </AppText>
        {estimatedEnd ? (
          <AppText align="center" color="secondary" variant="bodySmall">
            {estimatedEnd}
          </AppText>
        ) : null}
        {status ? (
          <AppText accessibilityLiveRegion="polite" align="center" variant="bodySmall">
            {status}
          </AppText>
        ) : null}
        <AppButton
          disabled={isChecking}
          loading={isChecking}
          onPress={() => void recheck()}
          title={t.retry}
        />
      </View>
    </AppScreen>
  );
}

function UpdateRequiredScreen() {
  const info = useLifecycleStore((state) => state.updateRequired);
  const locale = useLocaleStore((state) => state.locale);
  const t = useLocaleStore((state) => state.t.lifecycle);
  const [openFailed, setOpenFailed] = useState(false);
  const message = (locale === 'ar' ? info?.messageAr : info?.messageEn) || t.updateMessage;

  const openStore = useCallback(async () => {
    try {
      await Linking.openURL(resolveStoreUrl(info));
      setOpenFailed(false);
    } catch {
      setOpenFailed(true);
    }
  }, [info]);

  return (
    <AppScreen>
      <View style={styles.content}>
        <AppText align="center" variant="title">
          {t.updateTitle}
        </AppText>
        <AppText align="center" color="secondary" variant="body">
          {message}
        </AppText>
        {openFailed ? (
          <AppText align="center" color="error" variant="bodySmall">
            {t.updateOpenFailed}
          </AppText>
        ) : null}
        <AppButton onPress={() => void openStore()} title={t.updateAction} />
      </View>
    </AppScreen>
  );
}

/**
 * Global blocking host for server lifecycle states. It renders above the navigator, so a
 * maintenance window or a forced update interrupts whatever screen the user is on, and
 * maintenance clears itself once the backend reports it is over.
 */
export function LifecycleGate() {
  const hasUpdateRequired = useLifecycleStore((state) => state.updateRequired !== null);
  const hasMaintenance = useLifecycleStore((state) => state.maintenance !== null);
  const visible = hasUpdateRequired || hasMaintenance;

  return (
    <AppModal animationType="fade" onRequestClose={noop} visible={visible}>
      {hasUpdateRequired ? <UpdateRequiredScreen /> : <MaintenanceScreen />}
    </AppModal>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    alignItems: 'stretch',
    justifyContent: 'center',
    gap: spacing.lg,
    padding: spacing.xl,
    backgroundColor: colors.background.primary,
  },
});
