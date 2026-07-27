import { useEffect } from 'react';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { navigationRef } from '../../../navigation/navigationRef';
import { ProfileRoutes, RootRoutes, TabRoutes } from '../../../navigation/routes';
import { logger } from '../../../utils/logger';
import { useAuthStore } from '../../auth/store';
import { registerDeviceToken } from '../services';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function getProjectId(): string | undefined {
  return (
    Constants.easConfig?.projectId ??
    (Constants.expoConfig?.extra?.eas as { projectId?: string } | undefined)?.projectId
  );
}

async function registerCurrentDevice(authToken: string): Promise<void> {
  if (!Device.isDevice) return;

  const currentPermissions = await Notifications.getPermissionsAsync();
  const permissions = currentPermissions.granted
    ? currentPermissions
    : await Notifications.requestPermissionsAsync();
  if (!permissions.granted) return;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'إشعارات بانوراما',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#3510A3',
    });
  }

  const projectId = getProjectId();
  if (!projectId) {
    logger.warn('Expo project id is missing; push registration skipped');
    return;
  }

  const pushToken = await Notifications.getExpoPushTokenAsync({ projectId });
  await registerDeviceToken({ token: pushToken.data, platform: Platform.OS }, authToken);
}

function openNotificationsScreen(): void {
  if (!navigationRef.isReady()) return;
  navigationRef.navigate(RootRoutes.App, {
    screen: TabRoutes.Profile,
    params: { screen: ProfileRoutes.Notifications },
  });
}

export function PushNotificationsProvider() {
  const status = useAuthStore((state) => state.status);
  const accessToken = useAuthStore((state) => state.accessToken);

  useEffect(() => {
    if (status !== 'authenticated' || !accessToken) return;
    void registerCurrentDevice(accessToken).catch((error: unknown) => {
      logger.warn('Push token registration failed', {
        message: error instanceof Error ? error.message : 'unknown',
      });
    });
  }, [accessToken, status]);

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(() => {
      openNotificationsScreen();
    });
    return () => subscription.remove();
  }, []);

  return null;
}
