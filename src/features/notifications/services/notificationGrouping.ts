import type { NotificationDay, NotificationListRow, NotificationRecord } from '../types';

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

const DAY_MS = 24 * 60 * 60 * 1000;

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

/** Which calendar day (in the device time zone) a notification belongs to. */
export function getNotificationDay(
  createdAt: string | undefined,
  now: number = Date.now(),
): NotificationDay {
  if (!createdAt) {
    return { type: 'unknown' };
  }

  const created = new Date(createdAt);

  if (Number.isNaN(created.getTime())) {
    return { type: 'unknown' };
  }

  const diffDays = Math.round((startOfDay(new Date(now)) - startOfDay(created)) / DAY_MS);

  if (diffDays === 0) {
    return { type: 'today' };
  }

  if (diffDays === 1) {
    return { type: 'yesterday' };
  }

  return {
    type: 'date',
    iso: `${created.getFullYear()}-${pad(created.getMonth() + 1)}-${pad(created.getDate())}`,
  };
}

function dayKey(day: NotificationDay): string {
  return day.type === 'date' ? `d:${day.iso}` : day.type;
}

/**
 * Flattens notifications into list rows with a heading before each new day. The input order
 * is kept (the server returns newest first), so a day heading appears once per run.
 */
export function groupNotificationsByDay(
  notifications: NotificationRecord[],
  now: number = Date.now(),
): NotificationListRow[] {
  const rows: NotificationListRow[] = [];
  let currentKey: string | null = null;

  for (const notification of notifications) {
    const day = getNotificationDay(notification.created_at, now);
    const key = dayKey(day);

    if (key !== currentKey) {
      currentKey = key;
      rows.push({ kind: 'header', key: `h:${key}:${rows.length}`, day });
    }

    rows.push({ kind: 'item', key: `n:${String(notification.id)}`, notification });
  }

  return rows;
}

/** True when `expires_at` is a valid instant at or before `now`. */
export function isNotificationExpired(
  notification: Pick<NotificationRecord, 'expires_at'>,
  now: number = Date.now(),
): boolean {
  if (!notification.expires_at) {
    return false;
  }

  const at = Date.parse(notification.expires_at);

  return Number.isFinite(at) && at <= now;
}
