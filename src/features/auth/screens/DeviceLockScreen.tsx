import { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Linking, StyleSheet, View } from 'react-native';

import {
  AppButton,
  AppCard,
  AppText,
  FormAlert,
  FormScreen,
  IconTile,
  Stack,
} from '../../../components';
import { env } from '../../../config/env';
import { useTranslation } from '../../../i18n';
import { PublicRoutes } from '../../../navigation/routes';
import type { PublicStackParamList } from '../../../navigation/types';
import { colors, radius, spacing } from '../../../theme';
import { formatRelativeDate } from '../../../utils/formatRelativeDate';
import type { DeviceLockError } from '../services';
import { useAuthStore } from '../store';

type PublicNavigation = NativeStackNavigationProp<PublicStackParamList>;

const TICK_MS = 5_000;

function errorKey(error: DeviceLockError): 'network' | 'generic' | 'idRequired' | null {
  if (error === 'id_required') return 'idRequired';
  return error;
}

/**
 * Shown after a login with the right password from a phone the account is not linked to. It names the phone that owns the
 * account, states the policy (one account, one phone, one switch per term) and offers the switch. When no switch is left
 * it points to the administration instead.
 */
export function DeviceLockScreen() {
  const { t, locale } = useTranslation();
  const copy = t.deviceLock;
  const navigation = useNavigation<PublicNavigation>();
  const lock = useAuthStore((state) => state.deviceLock);
  const switchDevice = useAuthStore((state) => state.switchDevice);
  const tickDeviceLock = useAuthStore((state) => state.tickDeviceLock);
  const resetDeviceLock = useAuthStore((state) => state.resetDeviceLock);
  const [mailFailed, setMailFailed] = useState(false);

  // The switch link lives a few minutes: notice when it ran out even if the student left the screen open.
  useEffect(() => {
    const timer = setInterval(tickDeviceLock, TICK_MS);
    return () => clearInterval(timer);
  }, [tickDeviceLock]);

  // Leaving the screen (back gesture included) drops the pending switch offer: it must not outlive the visit.
  useEffect(() => () => resetDeviceLock(), [resetDeviceLock]);

  // Nothing pending (for example after a successful switch the session replaces this stack): leave quietly.
  useEffect(() => {
    if (lock.phase === 'none' && navigation.canGoBack()) navigation.goBack();
  }, [lock.phase, navigation]);

  function backToLogin() {
    resetDeviceLock();
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate(PublicRoutes.Login);
  }

  async function contactAdministration() {
    const url = `mailto:${env.supportEmail}?subject=${encodeURIComponent(copy.limit.mailSubject)}`;

    try {
      await Linking.openURL(url);
      setMailFailed(false);
    } catch {
      setMailFailed(true);
    }
  }

  const bound = lock.info?.boundDevice;
  const platform =
    bound?.platform === 'android'
      ? copy.platformAndroid
      : bound?.platform === 'ios'
        ? copy.platformIos
        : '';
  const deviceName = bound?.name || platform || copy.unknownDevice;
  const lastSeen = formatRelativeDate(bound?.lastSeenAt, t.relativeTime, locale);
  const switching = lock.phase === 'switching';
  const errorMessageKey = errorKey(lock.error);

  if (lock.phase === 'expired') {
    return (
      <FormScreen
        footer={<AppButton fullWidth onPress={backToLogin} size="lg" title={copy.backToLogin} />}
      >
        <Stack align="center" gap="md" style={styles.hero}>
          <IconTile icon="clock" size="lg" tone="warning" />
          <AppText align="center" variant="h2">
            {copy.expired.title}
          </AppText>
          <AppText align="center" color="secondary" variant="bodySmall">
            {copy.expired.description}
          </AppText>
        </Stack>
      </FormScreen>
    );
  }

  if (lock.phase === 'limit') {
    return (
      <FormScreen
        footer={
          <Stack gap="sm">
            <AppButton
              fullWidth
              onPress={() => void contactAdministration()}
              size="lg"
              title={copy.limit.contact}
            />
            <AppButton fullWidth onPress={backToLogin} title={copy.backToLogin} variant="ghost" />
          </Stack>
        }
      >
        <Stack align="center" gap="md" style={styles.hero}>
          <IconTile icon="shield" size="lg" tone="warning" />
          <AppText align="center" variant="h2">
            {copy.limit.title}
          </AppText>
          <AppText align="center" color="secondary" variant="bodySmall">
            {copy.limit.description}
          </AppText>
        </Stack>
        {bound ? (
          <OtherDeviceCard
            lastSeen={lastSeen ? copy.lastSeen(lastSeen) : null}
            name={deviceName}
            title={copy.otherDeviceTitle}
          />
        ) : null}
        {mailFailed ? (
          <FormAlert message={`${copy.limit.mailFailed} ${env.supportEmail}`} tone="info" />
        ) : null}
      </FormScreen>
    );
  }

  return (
    <FormScreen
      footer={
        <Stack gap="sm">
          <AppButton
            disabled={switching}
            fullWidth
            loading={switching}
            onPress={() => void switchDevice()}
            size="lg"
            title={switching ? copy.switching : copy.switchAction}
          />
          <AppButton
            disabled={switching}
            fullWidth
            onPress={backToLogin}
            title={copy.backToLogin}
            variant="ghost"
          />
        </Stack>
      }
    >
      <Stack align="center" gap="md" style={styles.hero}>
        <IconTile icon="lock" size="lg" tone="brand" />
        <AppText align="center" variant="h2">
          {copy.title}
        </AppText>
        <AppText align="center" color="secondary" variant="bodySmall">
          {copy.subtitle}
        </AppText>
      </Stack>

      {errorMessageKey ? <FormAlert message={copy.errors[errorMessageKey]} /> : null}

      <OtherDeviceCard
        lastSeen={lastSeen ? copy.lastSeen(lastSeen) : null}
        name={deviceName}
        title={copy.otherDeviceTitle}
      />

      <AppCard variant="muted">
        <Stack gap="sm">
          <AppText variant="title">{copy.policyTitle}</AppText>
          {copy.policy.map((rule) => (
            <View key={rule} style={styles.ruleRow}>
              <AppText color="muted" variant="bodySmall">
                •
              </AppText>
              <AppText color="secondary" style={styles.ruleText} variant="bodySmall">
                {rule}
              </AppText>
            </View>
          ))}
          {lock.info ? (
            <AppText variant="bodySmall" weight="600">
              {copy.switchesRemaining(lock.info.switchesRemaining)}
            </AppText>
          ) : null}
        </Stack>
      </AppCard>

      <AppText align="center" color="secondary" variant="caption">
        {copy.switchWarning}
      </AppText>
    </FormScreen>
  );
}

function OtherDeviceCard({
  title,
  name,
  lastSeen,
}: {
  title: string;
  name: string;
  lastSeen: string | null;
}) {
  return (
    <AppCard padding="lg" variant="elevated">
      <View accessible style={styles.deviceRow}>
        <IconTile icon="phone" tone="neutral" />
        <View style={styles.deviceText}>
          <AppText color="secondary" variant="caption">
            {title}
          </AppText>
          <AppText variant="title">{name}</AppText>
          {lastSeen ? (
            <AppText color="secondary" variant="bodySmall">
              {lastSeen}
            </AppText>
          ) : null}
        </View>
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingVertical: spacing.md,
  },
  ruleRow: { flexDirection: 'row', gap: spacing.sm },
  ruleText: { flex: 1 },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.lg,
    borderColor: colors.gray[200],
  },
  deviceText: { flex: 1, minWidth: 0, gap: spacing.xxs },
});
