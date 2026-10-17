import {
  getNotificationDay,
  groupNotificationsByDay,
  isNotificationExpired,
} from '../notificationGrouping';
import type { NotificationRecord } from '../../types';

const NOW = new Date(2026, 4, 10, 15, 0, 0).getTime();

function at(day: number, hour = 9): string {
  return new Date(2026, 4, day, hour, 0, 0).toISOString();
}

function note(id: number, createdAt?: string): NotificationRecord {
  return { id, created_at: createdAt };
}

describe('getNotificationDay', () => {
  it('names today and yesterday by calendar day, not by 24 hour windows', () => {
    expect(getNotificationDay(at(10, 0), NOW)).toEqual({ type: 'today' });
    expect(getNotificationDay(at(9, 23), NOW)).toEqual({ type: 'yesterday' });
    expect(getNotificationDay(at(7), NOW)).toEqual({ type: 'date', iso: '2026-05-07' });
  });

  it('handles missing or invalid dates', () => {
    expect(getNotificationDay(undefined, NOW)).toEqual({ type: 'unknown' });
    expect(getNotificationDay('nope', NOW)).toEqual({ type: 'unknown' });
  });
});

describe('groupNotificationsByDay', () => {
  it('adds one heading per day run and keeps order', () => {
    const rows = groupNotificationsByDay(
      [note(1, at(10)), note(2, at(10, 8)), note(3, at(9)), note(4, at(2))],
      NOW,
    );

    expect(
      rows.map((row) => (row.kind === 'header' ? row.day.type : `n${row.notification.id}`)),
    ).toEqual(['today', 'n1', 'n2', 'yesterday', 'n3', 'date', 'n4']);
    expect(new Set(rows.map((row) => row.key)).size).toBe(rows.length);
  });

  it('returns nothing for an empty list', () => {
    expect(groupNotificationsByDay([], NOW)).toEqual([]);
  });
});

describe('isNotificationExpired', () => {
  it('compares expires_at with now', () => {
    expect(isNotificationExpired({ expires_at: '2026-01-01T00:00:00Z' }, NOW)).toBe(true);
    expect(isNotificationExpired({ expires_at: '2099-01-01T00:00:00Z' }, NOW)).toBe(false);
    expect(isNotificationExpired({ expires_at: null }, NOW)).toBe(false);
    expect(isNotificationExpired({ expires_at: 'garbage' }, NOW)).toBe(false);
  });
});
