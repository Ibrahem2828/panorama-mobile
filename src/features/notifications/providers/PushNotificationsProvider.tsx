import { useEffect } from 'react';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { navigationRef } from '../../../navigation/navigationRef';
import { ProfileRoutes, RootRoutes, TabRoutes } from '../../../navigation/routes';
import { useTranslation, type TranslationCatalog } from '../../../i18n';
import { groupsService } from '../../../api';
import { logger } from '../../../utils/logger';
import { useAuthStore } from '../../auth/store';
import { useChatStore } from '../../chat/store';
import { useChatUnreadStore } from '../../chat/store/unreadStore';
import {
  navigateToNotificationIntent,
  registerDeviceToken,
  resolveNotificationIntent,
} from '../services';

function chatPushOf(data: Record<string, unknown> | null | undefined) {
  const groupId = Number(data?.group_id);
  const messageId = Number(data?.message_id);

  return data?.kind === 'chat' && Number.isFinite(groupId) && Number.isFinite(messageId)
    ? { groupId, messageId }
    : null;
}

Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const chat = chatPushOf(notification.request.content.data);
    const active = useChatStore.getState().activeGroupId;
    // Someone reading this very chat does not need a banner for it.
    const reading = chat !== null && active !== null && String(active) === String(chat.groupId);

    return {
      shouldPlaySound: !reading,
      shouldSetBadge: !reading,
      shouldShowBanner: !reading,
      shouldShowList: !reading,
    };
  },
});

function getProjectId(): string | undefined {
  return (
    Constants.easConfig?.projectId ??
    (Constants.expoConfig?.extra?.eas as { projectId?: string } | undefined)?.projectId
  );
}

async function registerCurrentDevice(
  authToken: string,
  catalog: TranslationCatalog['notifications'],
): Promise<void> {
  if (!Device.isDevice) return;

  const currentPermissions = await Notifications.getPermissionsAsync();
  const permissions = currentPermissions.granted
    ? currentPermissions
    : await Notifications.requestPermissionsAsync();
  if (!permissions.granted) return;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: catalog.androidChannelName,
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#3510A3',
    });
    // The backend sends chat pushes on this channel so members can tune them apart from the rest.
    await Notifications.setNotificationChannelAsync('chat', {
      name: catalog.androidChatChannelName,
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 200, 150, 200],
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

function openNotificationTarget(data: Record<string, unknown> | null | undefined): void {
  if (!navigationRef.isReady()) return;

  const deepLink = typeof data?.deep_link === 'string' ? data.deep_link : undefined;
  const intent = resolveNotificationIntent({ deep_link: deepLink, data: data ?? null });

  // Unresolved targets fall back to the list rather than a dead route.
  if (!navigateToNotificationIntent(intent)) openNotificationsScreen();
}

export function PushNotificationsProvider() {
  const { t } = useTranslation();
  const status = useAuthStore((state) => state.status);
  const accessToken = useAuthStore((state) => state.accessToken);

  useEffect(() => {
    if (status !== 'authenticated' || !accessToken) return;
    void registerCurrentDevice(accessToken, t.notifications).catch((error: unknown) => {
      logger.warn('Push token registration failed', {
        message: error instanceof Error ? error.message : 'unknown',
      });
    });
  }, [accessToken, status, t.notifications]);

  // A chat push that reaches the phone means the message is delivered (grey double tick for its sender).
  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener((notification) => {
      const chat = chatPushOf(notification.request.content.data);
      const token = useAuthStore.getState().accessToken;

      if (!chat || !token) return;

      void groupsService
        .postChatReceipts(chat.groupId, { delivered_up_to: chat.messageId }, token)
        .catch(() => undefined);
      void useChatUnreadStore.getState().load();
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      openNotificationTarget(response.notification.request.content.data);
    });
    return () => subscription.remove();
  }, []);

  return null;
}
