import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as Notifications from 'expo-notifications';
import { Linking, Platform } from 'react-native';

import {
  INITIAL_SNAPSHOT,
  toPermissionStatus,
  type PermissionKey,
  type PermissionSnapshot,
  type PermissionStatus,
} from './permissionState';

export const PERMISSIONS_INTRO_STORAGE_KEY = 'panorama_permissions_intro_v1';
const ANDROID_PACKAGE = 'com.panorama.student';

export async function hasSeenPermissionsIntro(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(PERMISSIONS_INTRO_STORAGE_KEY)) === 'true';
  } catch {
    // If storage is unavailable never trap the user in the intro.
    return true;
  }
}

export async function markPermissionsIntroSeen(): Promise<void> {
  try {
    await AsyncStorage.setItem(PERMISSIONS_INTRO_STORAGE_KEY, 'true');
  } catch {
    // Persisting this is a courtesy: the next launch may show the intro once more.
  }
}

async function readNotifications(): Promise<PermissionStatus> {
  try {
    return toPermissionStatus(await Notifications.getPermissionsAsync());
  } catch {
    return 'undetermined';
  }
}

async function readCamera(): Promise<PermissionStatus> {
  try {
    return toPermissionStatus(await ImagePicker.getCameraPermissionsAsync());
  } catch {
    return 'undetermined';
  }
}

/** Current status of every capability. Never throws. */
export async function checkPermissions(): Promise<PermissionSnapshot> {
  const [notifications, camera] = await Promise.all([readNotifications(), readCamera()]);

  return { ...INITIAL_SNAPSHOT, notifications, camera };
}

/** Shows the system dialog for one runtime permission and returns the new status. Never throws. */
export async function requestPermission(key: PermissionKey): Promise<PermissionStatus> {
  try {
    if (key === 'notifications') {
      return toPermissionStatus(await Notifications.requestPermissionsAsync());
    }

    if (key === 'camera') {
      return toPermissionStatus(await ImagePicker.requestCameraPermissionsAsync());
    }
  } catch {
    // Falls through to a fresh read below.
  }

  const snapshot = await checkPermissions();

  return snapshot[key];
}

/** Opens the system settings of this app (where a blocked permission can be switched on). */
export async function openAppSettings(): Promise<void> {
  try {
    await Linking.openSettings();
  } catch {
    // Nothing else to do: the user can open the settings by hand.
  }
}

/**
 * Opens the system screen where each notification channel (chat, groups, printing...) is tuned. Falls back to the general
 * app settings when the device does not support the direct intent.
 */
export async function openNotificationSystemSettings(): Promise<void> {
  if (Platform.OS === 'android') {
    try {
      await Linking.sendIntent('android.settings.APP_NOTIFICATION_SETTINGS', [
        { key: 'android.provider.extra.APP_PACKAGE', value: ANDROID_PACKAGE },
      ]);
      return;
    } catch {
      // Older or customised systems: use the generic settings page.
    }
  }

  await openAppSettings();
}
