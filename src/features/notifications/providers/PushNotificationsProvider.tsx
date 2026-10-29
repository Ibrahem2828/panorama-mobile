import { useEffect } from 'react';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { AppState, Platform } from 'react-native';

import { ensureNotificationChannels } from '../../permissions/notificationChannels';
import { navigationRef } from '../../../navigation/navigationRef';
import { ProfileRoutes, RootRoutes, TabRoutes } from '../../../navigation/routes';
import { useTranslation, type TranslationCatalog } from '../../../i18n';
import { groupsService } from '../../../api';
import { env } from '../../../config/env';
import { logger } from '../../../utils/logger';
import { useAuthStore } from '../../auth/store';
import { useChatStore } from '../../chat/store';
import { useChatUnreadStore } from '../../chat/store/unreadStore';
import {
  foregroundBannerPolicy,
  intentFromPushData,
  navigateToNotificationIntent,
  pushCategory,
  registerDeviceToken,
  resolveNotificationIntent,
} from '../services';
import { useNotificationPrefsStore } from '../store/notificationPrefsStore';

/** Pushes whose tap was already routed (the cold-start path and the listener must not both open the screen). */
const handledResponses = new Set<string>();

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
    // Foreground policy: nothing for the chat being read or a category the user switched off; silent in quiet hours.
    const policy = foregroundBannerPolicy({
      category: pushCategory(notification.request.content.data),
      prefs: useNotificationPrefsStore.getState().prefs,
      now: new Date(),
      readingThisChat: reading,
    });

    return {
      shouldPlaySound: policy.sound,
      shouldSetBadge: policy.badge,
      shouldShowBanner: policy.show,
      shouldShowList: policy.show,
    };
  },
});

/** Reloads everything the tab badges show (notification summary and unread chat counts). */
function refreshBadges() {
  void useNotificationPrefsStore.getState().loadSummary();
  void useChatUnreadStore.getState().load();
}

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
  // Emulators cannot receive production pushes, but non-production builds register them so the push chain can be tested.
  if (!Device.isDevice && env.appEnv === 'production') return;

  const currentPermissions = await Notifications.getPermissionsAsync();
  const permissions = currentPermissions.granted
    ? currentPermissions
    : await Notifications.requestPermissionsAsync();
  if (!permissions.granted) return;

  if (Platform.OS === 'android') {
    await ensureNotificationChannels(catalog.channels);
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

  if (navigateToNotificationIntent(intent)) return;

  // No usable deep link: route by the push's category and ids; an unresolved target falls back to the inbox.
  const byCategory = intentFromPushData(data);

  if (byCategory && navigateToNotificationIntent(byCategory)) return;

  openNotificationsScreen();
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

  // Preferences (for the foreground banner policy) and the unread summary (tab badges), kept fresh while signed in.
  useEffect(() => {
    if (status !== 'authenticated' || !accessToken) return undefined;

    void useNotificationPrefsStore.getState().loadPrefs();
    refreshBadges();

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        refreshBadges();
      }
    });

    return () => subscription.remove();
  }, [accessToken, status]);

  // A chat push that reaches the phone means the message is delivered (grey double tick for its sender).
  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener((notification) => {
      const chat = chatPushOf(notification.request.content.data);
      const token = useAuthStore.getState().accessToken;

      refreshBadges();

      if (!chat || !token) return;

      void groupsService
        .postChatReceipts(chat.groupId, { delivered_up_to: chat.messageId }, token)
        .catch(() => undefined);
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      handledResponses.add(response.notification.request.identifier);
      openNotificationTarget(response.notification.request.content.data);
    });
    return () => subscription.remove();
  }, []);

  // A tap that launched the app from a closed state is delivered before any listener exists: read it once the session and
  // the navigator are ready, so the push lands on its screen instead of the home screen.
  const lastResponse = Notifications.useLastNotificationResponse();

  useEffect(() => {
    if (status !== 'authenticated' || !lastResponse) return undefined;

    const id = lastResponse.notification.request.identifier;

    if (handledResponses.has(id)) return undefined;

    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;

      if (navigationRef.isReady()) {
        clearInterval(timer);
        handledResponses.add(id);
        openNotificationTarget(lastResponse.notification.request.content.data);
      } else if (tries > 40) {
        clearInterval(timer);
      }
    }, 250);

    return () => clearInterval(timer);
  }, [lastResponse, status]);

  return null;
}
