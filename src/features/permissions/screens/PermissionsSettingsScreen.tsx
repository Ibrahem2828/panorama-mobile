import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AppHeader, AppScreen, AppText, Stack } from '../../../components';
import { useTranslation } from '../../../i18n';
import { ProfileRoutes } from '../../../navigation/routes';
import type { ProfileStackParamList } from '../../../navigation/types';
import { PermissionsPanel } from '../components/PermissionsPanel';
import { usePermissions } from '../usePermissions';

type Props = NativeStackScreenProps<ProfileStackParamList, 'Permissions'>;

/** Settings > Permissions: the same rows as the first-run screen, always reflecting the system's current state. */
export function PermissionsSettingsScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { snapshot, busyKey, request, allowAll } = usePermissions();

  return (
    <AppScreen scroll>
      <Stack gap="lg">
        <AppHeader
          onBack={() => navigation.goBack()}
          showBack
          subtitle={t.permissions.settingsSubtitle}
          title={t.permissions.settingsTitle}
        />
        <PermissionsPanel
          busyKey={busyKey}
          onAllowAll={() => void allowAll()}
          onOpenNotificationSettings={() => navigation.navigate(ProfileRoutes.NotificationSettings)}
          onRequest={(key) => void request(key)}
          snapshot={snapshot}
        />
        <AppText color="muted" variant="caption">
          {t.permissions.footnote}
        </AppText>
      </Stack>
    </AppScreen>
  );
}
