import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { useTranslation } from '../../i18n';
import { ensureNotificationChannels, type NotificationChannelId } from './notificationChannels';
import { checkPermissions, requestPermission } from './permissionsService';
import {
  INITIAL_SNAPSHOT,
  pendingRequests,
  type PermissionKey,
  type PermissionSnapshot,
} from './permissionState';

/**
 * Live permission status for the permissions screens. Refreshes when the screen opens and whenever the app returns to the
 * foreground (the user may have changed a permission in the system settings).
 */
export function usePermissions() {
  const { t } = useTranslation();
  const [snapshot, setSnapshot] = useState<PermissionSnapshot>(INITIAL_SNAPSHOT);
  const [busyKey, setBusyKey] = useState<PermissionKey | 'all' | null>(null);
  const mounted = useRef(true);
  const channelNames = t.notifications.channels as Record<NotificationChannelId, string>;

  const refresh = useCallback(async () => {
    const next = await checkPermissions();

    if (mounted.current) {
      setSnapshot(next);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    void refresh();

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void refresh();
      }
    });

    return () => {
      mounted.current = false;
      subscription.remove();
    };
  }, [refresh]);

  const request = useCallback(
    async (key: PermissionKey) => {
      setBusyKey(key);

      try {
        if (key === 'notifications') {
          // Android 13+ shows the notification dialog only after a channel exists.
          await ensureNotificationChannels(channelNames);
        }

        const status = await requestPermission(key);

        if (mounted.current) {
          setSnapshot((current) => ({ ...current, [key]: status }));
        }
      } finally {
        if (mounted.current) {
          setBusyKey(null);
        }
      }
    },
    [channelNames],
  );

  const allowAll = useCallback(async () => {
    setBusyKey('all');

    try {
      await ensureNotificationChannels(channelNames);

      // One dialog at a time, in order; a refusal never stops the next request.
      for (const key of pendingRequests(await checkPermissions())) {
        const status = await requestPermission(key);

        if (mounted.current) {
          setSnapshot((current) => ({ ...current, [key]: status }));
        }
      }
    } finally {
      if (mounted.current) {
        setBusyKey(null);
      }
    }
  }, [channelNames]);

  return { snapshot, busyKey, refresh, request, allowAll };
}
