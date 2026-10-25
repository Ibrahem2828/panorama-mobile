import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/** The Android notification channels. The backend picks one per push; the user tunes each in the system settings. */
export const NOTIFICATION_CHANNEL_IDS = [
  'default',
  'general',
  'chat',
  'groups',
  'printing',
  'verification',
  'support',
] as const;

export type NotificationChannelId = (typeof NOTIFICATION_CHANNEL_IDS)[number];

/** File name of the Panorama chime bundled by the expo-notifications plugin (res/raw/panorama.wav). */
export const NOTIFICATION_SOUND = 'panorama.wav';

const VIBRATION: Record<NotificationChannelId, number[]> = {
  default: [0, 250, 250, 250],
  general: [0, 250, 250, 250],
  chat: [0, 200, 150, 200],
  groups: [0, 250, 250, 250],
  printing: [0, 250, 250, 250],
  verification: [0, 250, 250, 250],
  support: [0, 250, 250, 250],
};

/**
 * Creates (or updates the name of) every channel. Android 13+ shows the notification permission dialog only once a channel
 * exists, so this runs before the first request. Safe to call repeatedly; does nothing off Android.
 */
export async function ensureNotificationChannels(
  names: Record<NotificationChannelId, string>,
): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }

  await Promise.all(
    NOTIFICATION_CHANNEL_IDS.map((id) =>
      Notifications.setNotificationChannelAsync(id, {
        name: names[id],
        importance: Notifications.AndroidImportance.HIGH,
        // Channels are immutable once created, so the chime lives on the new ids ("general" replaces "default").
        sound: id === 'default' ? 'default' : NOTIFICATION_SOUND,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PRIVATE,
        enableLights: true,
        enableVibrate: true,
        vibrationPattern: VIBRATION[id],
        lightColor: '#3510A3',
      }).catch(() => undefined),
    ),
  );
}
