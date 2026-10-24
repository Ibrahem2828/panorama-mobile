import { useCallback, useEffect, useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Switch, View } from 'react-native';

import {
  AppButton,
  AppCard,
  AppHeader,
  AppScreen,
  AppText,
  ErrorState,
  LoadingState,
  Stack,
} from '../../../components';
import { useTranslation } from '../../../i18n';
import { ProfileRoutes } from '../../../navigation/routes';
import type { ProfileStackParamList } from '../../../navigation/types';
import { colors, spacing, useBrand } from '../../../theme';
import {
  canRequest,
  checkPermissions,
  openAppSettings,
  openNotificationSystemSettings,
  requestPermission,
  type PermissionStatus,
} from '../../permissions';
import { ensureNotificationChannels } from '../../permissions/notificationChannels';
import {
  NOTIFICATION_CATEGORIES,
  shiftTime,
  type NotificationCategory,
} from '../services/notificationPrefs';
import { useNotificationPrefsStore } from '../store/notificationPrefsStore';

type Props = NativeStackScreenProps<ProfileStackParamList, 'NotificationSettings'>;

function SwitchRow({
  label,
  description,
  value,
  disabled,
  onChange,
}: {
  label: string;
  description?: string;
  value: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
}) {
  const brand = useBrand();

  return (
    <View style={styles.switchRow}>
      <View style={styles.flex}>
        <AppText variant="label" weight="600">
          {label}
        </AppText>
        {description ? (
          <AppText color="secondary" variant="caption">
            {description}
          </AppText>
        ) : null}
      </View>
      <Switch
        accessibilityLabel={label}
        disabled={disabled}
        onValueChange={onChange}
        thumbColor={colors.background.surface}
        trackColor={{ false: colors.border.strong, true: brand.primary }}
        value={value}
      />
    </View>
  );
}

function TimeStepper({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <View style={styles.timeRow}>
      <AppText style={styles.flex} variant="label">
        {label}
      </AppText>
      <AppButton
        accessibilityLabel={`${label} - ${t.notifications.settings.earlier}`}
        onPress={() => onChange(shiftTime(value, -30))}
        size="sm"
        title="−"
        variant="outline"
      />
      <AppText style={styles.time} variant="title">
        {value}
      </AppText>
      <AppButton
        accessibilityLabel={`${label} - ${t.notifications.settings.later}`}
        onPress={() => onChange(shiftTime(value, 30))}
        size="sm"
        title="+"
        variant="outline"
      />
    </View>
  );
}

/**
 * Settings > Notifications: the system permission, the master push switch, one switch per category (chat, groups, printing,
 * verification, support) and quiet hours. A control appears only when the server returned the matching field, so an older
 * backend simply shows fewer options.
 */
export function NotificationSettingsScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const copy = t.notifications.settings;
  const prefs = useNotificationPrefsStore((state) => state.prefs);
  const isLoading = useNotificationPrefsStore((state) => state.isLoading);
  const failed = useNotificationPrefsStore((state) => state.failed);
  const loadPrefs = useNotificationPrefsStore((state) => state.loadPrefs);
  const setPush = useNotificationPrefsStore((state) => state.setPush);
  const setChannel = useNotificationPrefsStore((state) => state.setChannel);
  const setQuietHours = useNotificationPrefsStore((state) => state.setQuietHours);
  const [permission, setPermission] = useState<PermissionStatus>('undetermined');

  const refreshPermission = useCallback(async () => {
    setPermission((await checkPermissions()).notifications);
  }, []);

  useEffect(() => {
    void loadPrefs();
    void refreshPermission();
  }, [loadPrefs, refreshPermission]);

  async function allow() {
    await ensureNotificationChannels(t.notifications.channels);
    setPermission(await requestPermission('notifications'));
  }

  const categoryLabels = t.notifications.categories as Record<NotificationCategory, string>;

  return (
    <AppScreen scroll>
      <Stack gap="lg">
        <AppHeader
          onBack={() => navigation.goBack()}
          showBack
          subtitle={copy.subtitle}
          title={copy.title}
        />

        {permission !== 'granted' ? (
          <AppCard variant="muted">
            <Stack gap="sm">
              <AppText variant="label" weight="700">
                {copy.permissionOffTitle}
              </AppText>
              <AppText color="secondary" variant="bodySmall">
                {copy.permissionOffBody}
              </AppText>
              {canRequest(permission) ? (
                <AppButton onPress={() => void allow()} size="sm" title={copy.allow} />
              ) : (
                <AppButton
                  onPress={() => void openAppSettings()}
                  size="sm"
                  title={copy.openSettings}
                  variant="outline"
                />
              )}
            </Stack>
          </AppCard>
        ) : null}

        {isLoading && !prefs ? <LoadingState message={t.common.loading} /> : null}
        {failed && !prefs ? (
          <ErrorState message={copy.loadFailed} onRetry={() => void loadPrefs()} />
        ) : null}

        {prefs ? (
          <>
            <AppCard variant="outlined">
              <SwitchRow
                description={copy.pushDescription}
                label={copy.push}
                onChange={(value) => void setPush(value)}
                value={prefs.push}
              />
            </AppCard>

            {prefs.channels ? (
              <AppCard variant="outlined">
                <Stack gap="md">
                  <AppText variant="title">{copy.categoriesTitle}</AppText>
                  {NOTIFICATION_CATEGORIES.map((category) => (
                    <SwitchRow
                      disabled={!prefs.push}
                      key={category}
                      label={categoryLabels[category]}
                      onChange={(value) => void setChannel(category, value)}
                      value={prefs.channels?.[category] ?? true}
                    />
                  ))}
                </Stack>
              </AppCard>
            ) : null}

            {prefs.quietHours ? (
              <AppCard variant="outlined">
                <Stack gap="md">
                  <AppText variant="title">{copy.quietTitle}</AppText>
                  <SwitchRow
                    description={copy.quietDescription}
                    label={copy.quietEnable}
                    onChange={(enabled) =>
                      void setQuietHours({
                        ...(prefs.quietHours as NonNullable<typeof prefs.quietHours>),
                        enabled,
                      })
                    }
                    value={prefs.quietHours.enabled}
                  />
                  {prefs.quietHours.enabled ? (
                    <>
                      <TimeStepper
                        label={copy.quietFrom}
                        onChange={(start) =>
                          void setQuietHours({
                            ...(prefs.quietHours as NonNullable<typeof prefs.quietHours>),
                            start,
                          })
                        }
                        value={prefs.quietHours.start}
                      />
                      <TimeStepper
                        label={copy.quietTo}
                        onChange={(end) =>
                          void setQuietHours({
                            ...(prefs.quietHours as NonNullable<typeof prefs.quietHours>),
                            end,
                          })
                        }
                        value={prefs.quietHours.end}
                      />
                    </>
                  ) : null}
                </Stack>
              </AppCard>
            ) : null}

            {failed ? (
              <AppText color="error" variant="caption">
                {copy.saveFailed}
              </AppText>
            ) : null}
          </>
        ) : null}

        <Stack gap="sm">
          <AppButton
            onPress={() => void openNotificationSystemSettings()}
            title={copy.systemSettings}
            variant="outline"
          />
          <AppText color="muted" variant="caption">
            {copy.systemSettingsHint}
          </AppText>
          <AppButton
            onPress={() => navigation.navigate(ProfileRoutes.Notifications)}
            title={copy.openInbox}
            variant="ghost"
          />
        </Stack>
      </Stack>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  time: { minWidth: 64, textAlign: 'center' },
});
