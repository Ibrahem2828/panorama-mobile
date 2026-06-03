import { create } from 'zustand';

import { useAuthStore } from '../../auth/store';
import { useHomeStore } from '../../home/store';
import {
  isNotificationUnread,
  loadNotifications,
  loadUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
  toSafeNotificationsErrorMessage,
} from '../services';
import type { Id, NotificationRecord } from '../types';

type NotificationsState = {
  notifications: NotificationRecord[];
  unreadCount: number;
  isLoading: boolean;
  isLoadingUnreadCount: boolean;
  isRefreshing: boolean;
  isMarkingRead: boolean;
  isMarkingAllRead: boolean;
  errorMessage: string | null;
  successMessage: string | null;
  lastLoadedAt: string | null;
  notificationsCount: number;

  loadNotifications: () => Promise<void>;
  loadUnreadCount: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  markAsRead: (notificationId: Id) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearError: () => void;
  clearMessages: () => void;
};

const MISSING_SESSION_MESSAGE = 'انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى.';
const MARK_READ_SUCCESS_MESSAGE = 'تم تعليم الإشعار كمقروء.';
const MARK_ALL_READ_SUCCESS_MESSAGE = 'تم تعليم كل الإشعارات كمقروءة.';

function getAccessToken(): string | null {
  return useAuthStore.getState().accessToken;
}

function isSameId(left: Id, right: Id): boolean {
  return String(left) === String(right);
}

function syncHomeUnreadCount(unreadCount: number) {
  useHomeStore.getState().setUnreadNotificationsCount(unreadCount);
}

function markOneLocal(notifications: NotificationRecord[], notificationId: Id) {
  let changedUnread = false;
  const nextNotifications = notifications.map((notification) => {
    if (!isSameId(notification.id, notificationId)) {
      return notification;
    }

    changedUnread = isNotificationUnread(notification);

    return {
      ...notification,
      is_read: true,
      read_at: notification.read_at ?? new Date().toISOString(),
    };
  });

  return {
    notifications: nextNotifications,
    changedUnread,
  };
}

function markAllLocal(notifications: NotificationRecord[]): NotificationRecord[] {
  const readAt = new Date().toISOString();

  return notifications.map((notification) => ({
    ...notification,
    is_read: true,
    read_at: notification.read_at ?? readAt,
  }));
}

export const useNotificationsStore = create<NotificationsState>((set, get) => {
  function requireToken(): string | null {
    const accessToken = getAccessToken();

    if (!accessToken) {
      set({
        errorMessage: MISSING_SESSION_MESSAGE,
        isLoading: false,
        isLoadingUnreadCount: false,
        isRefreshing: false,
        isMarkingRead: false,
        isMarkingAllRead: false,
      });
      return null;
    }

    return accessToken;
  }

  async function reloadNotifications(accessToken: string) {
    const response = await loadNotifications(accessToken);

    set({
      notifications: response.results,
      notificationsCount: response.count,
      lastLoadedAt: new Date().toISOString(),
    });
  }

  async function reloadUnreadCount(accessToken: string) {
    const response = await loadUnreadCount(accessToken);
    const unreadCount = Math.max(0, response.count);

    set({ unreadCount });
    syncHomeUnreadCount(unreadCount);
  }

  return {
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    isLoadingUnreadCount: false,
    isRefreshing: false,
    isMarkingRead: false,
    isMarkingAllRead: false,
    errorMessage: null,
    successMessage: null,
    lastLoadedAt: null,
    notificationsCount: 0,

    async loadNotifications() {
      if (get().isLoading) {
        return;
      }

      const accessToken = requireToken();

      if (!accessToken) {
        return;
      }

      set({ isLoading: true, errorMessage: null, successMessage: null });

      try {
        await reloadNotifications(accessToken);
        set({ isLoading: false });
      } catch (error) {
        set({
          isLoading: false,
          errorMessage: toSafeNotificationsErrorMessage(error),
        });
      }
    },

    async loadUnreadCount() {
      if (get().isLoadingUnreadCount) {
        return;
      }

      const accessToken = requireToken();

      if (!accessToken) {
        return;
      }

      set({ isLoadingUnreadCount: true, errorMessage: null });

      try {
        await reloadUnreadCount(accessToken);
        set({ isLoadingUnreadCount: false });
      } catch (error) {
        set({
          isLoadingUnreadCount: false,
          errorMessage: toSafeNotificationsErrorMessage(error),
        });
      }
    },

    async refreshNotifications() {
      if (get().isRefreshing) {
        return;
      }

      const accessToken = requireToken();

      if (!accessToken) {
        return;
      }

      set({ isRefreshing: true, errorMessage: null, successMessage: null });

      try {
        await Promise.all([reloadNotifications(accessToken), reloadUnreadCount(accessToken)]);
        set({ isRefreshing: false });
      } catch (error) {
        set({
          isRefreshing: false,
          errorMessage: toSafeNotificationsErrorMessage(error),
        });
      }
    },

    async markAsRead(notificationId) {
      if (get().isMarkingRead) {
        return;
      }

      const accessToken = requireToken();

      if (!accessToken) {
        return;
      }

      const previousNotifications = get().notifications;
      const previousUnreadCount = get().unreadCount;
      const localUpdate = markOneLocal(previousNotifications, notificationId);
      const nextUnreadCount = localUpdate.changedUnread
        ? Math.max(0, previousUnreadCount - 1)
        : previousUnreadCount;

      set({
        notifications: localUpdate.notifications,
        unreadCount: nextUnreadCount,
        isMarkingRead: true,
        errorMessage: null,
        successMessage: null,
      });
      syncHomeUnreadCount(nextUnreadCount);

      try {
        await markNotificationRead(notificationId, accessToken);
        set({
          isMarkingRead: false,
          successMessage: MARK_READ_SUCCESS_MESSAGE,
        });
      } catch (error) {
        set({
          notifications: previousNotifications,
          unreadCount: previousUnreadCount,
          isMarkingRead: false,
          errorMessage: toSafeNotificationsErrorMessage(error),
        });
        syncHomeUnreadCount(previousUnreadCount);
      }
    },

    async markAllAsRead() {
      if (get().isMarkingAllRead) {
        return;
      }

      const accessToken = requireToken();

      if (!accessToken) {
        return;
      }

      const previousNotifications = get().notifications;
      const previousUnreadCount = get().unreadCount;

      set({
        notifications: markAllLocal(previousNotifications),
        unreadCount: 0,
        isMarkingAllRead: true,
        errorMessage: null,
        successMessage: null,
      });
      syncHomeUnreadCount(0);

      try {
        await markAllNotificationsRead(accessToken);
        set({
          isMarkingAllRead: false,
          successMessage: MARK_ALL_READ_SUCCESS_MESSAGE,
        });
      } catch (error) {
        set({
          notifications: previousNotifications,
          unreadCount: previousUnreadCount,
          isMarkingAllRead: false,
          errorMessage: toSafeNotificationsErrorMessage(error),
        });
        syncHomeUnreadCount(previousUnreadCount);
      }
    },

    clearError() {
      set({ errorMessage: null });
    },

    clearMessages() {
      set({ errorMessage: null, successMessage: null });
    },
  };
});
