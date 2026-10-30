import {
  channelPatch,
  foregroundBannerPolicy,
  intentFromPushData,
  isValidTime,
  isWithinQuietHours,
  muteCommunitiesPatch,
  normalizePreferences,
  normalizeSummary,
  pushCategory,
  quietHoursPatch,
  shiftTime,
  tabBadgeCounts,
} from '../notificationPrefs';

const at = (hours: number, minutes = 0) => new Date(2026, 9, 24, hours, minutes);

describe('normalizePreferences', () => {
  it('hides what an older backend does not return', () => {
    const prefs = normalizePreferences({
      in_app_enabled: true,
      push_enabled: false,
      disabled_types: [],
    });

    expect(prefs.push).toBe(false);
    expect(prefs.channels).toBeNull();
    expect(prefs.quietHours).toBeNull();
    expect(prefs.muteCommunities).toBeNull();
  });

  it('reads the communities switch and builds its PATCH body', () => {
    expect(normalizePreferences({ mute_communities: true }).muteCommunities).toBe(true);
    expect(normalizePreferences({ mute_communities: false }).muteCommunities).toBe(false);
    expect(normalizePreferences({ mute_communities: 'yes' }).muteCommunities).toBeNull();
    expect(muteCommunitiesPatch(true)).toEqual({ mute_communities: true });
  });

  it('reads channels (missing means on) and quiet hours', () => {
    const prefs = normalizePreferences({
      push_enabled: true,
      channels: { chat: false, support: true },
      quiet_hours: { enabled: true, start: '23:30', end: '06:00', timezone: 'Asia/Damascus' },
    });

    expect(prefs.channels).toEqual({
      chat: false,
      groups: true,
      printing: true,
      verification: true,
      support: true,
    });
    expect(prefs.quietHours).toEqual({
      enabled: true,
      start: '23:30',
      end: '06:00',
      timezone: 'Asia/Damascus',
    });
  });

  it('repairs malformed times and survives garbage', () => {
    expect(
      normalizePreferences({ quiet_hours: { enabled: true, start: '25:99', end: 'x' } }).quietHours,
    ).toMatchObject({
      start: '22:00',
      end: '07:00',
    });
    expect(normalizePreferences(null).push).toBe(true);
    expect(normalizePreferences('nope').channels).toBeNull();
  });
});

describe('patches', () => {
  const channels = { chat: true, groups: true, printing: true, verification: true, support: true };

  it('sends the whole channels object with one switch flipped', () => {
    expect(channelPatch(channels, 'printing', false)).toEqual({
      channels: { ...channels, printing: false },
    });
  });

  it('refuses malformed quiet hours and adds the timezone', () => {
    expect(quietHoursPatch({ enabled: true, start: '9:00', end: '07:00' })).toBeNull();
    expect(
      quietHoursPatch({ enabled: true, start: '22:00', end: '07:00' }, 'Asia/Damascus'),
    ).toEqual({
      quiet_hours: { enabled: true, start: '22:00', end: '07:00', timezone: 'Asia/Damascus' },
    });
  });

  it('validates HH:MM and shifts by half hours across midnight', () => {
    expect(isValidTime('07:05')).toBe(true);
    expect(isValidTime('24:00')).toBe(false);
    expect(shiftTime('23:45', 30)).toBe('00:15');
    expect(shiftTime('00:10', -30)).toBe('23:40');
  });
});

describe('quiet hours', () => {
  const overnight = { enabled: true, start: '22:00', end: '07:00' };

  it('handles a window that wraps past midnight', () => {
    expect(isWithinQuietHours(at(23), overnight)).toBe(true);
    expect(isWithinQuietHours(at(3), overnight)).toBe(true);
    expect(isWithinQuietHours(at(7), overnight)).toBe(false);
    expect(isWithinQuietHours(at(12), overnight)).toBe(false);
  });

  it('handles a same-day window and ignores a disabled or empty one', () => {
    expect(isWithinQuietHours(at(13, 30), { enabled: true, start: '13:00', end: '14:00' })).toBe(
      true,
    );
    expect(isWithinQuietHours(at(14), { enabled: true, start: '13:00', end: '14:00' })).toBe(false);
    expect(isWithinQuietHours(at(23), { ...overnight, enabled: false })).toBe(false);
    expect(isWithinQuietHours(at(23), { enabled: true, start: '08:00', end: '08:00' })).toBe(false);
    expect(isWithinQuietHours(at(23), null)).toBe(false);
  });
});

describe('push categories and the foreground policy', () => {
  it('derives the category from the push data', () => {
    expect(pushCategory({ kind: 'chat' })).toBe('chat');
    expect(pushCategory({ kind: 'enrollment' })).toBe('groups');
    expect(pushCategory({ category: 'printing' })).toBe('printing');
    expect(pushCategory({ type: 'announcement' })).toBeNull();
    expect(pushCategory(null)).toBeNull();
  });

  const prefs = normalizePreferences({
    channels: { printing: false },
    quiet_hours: { enabled: true, start: '22:00', end: '07:00' },
  });

  it('hides a switched-off category and the chat being read', () => {
    expect(
      foregroundBannerPolicy({ category: 'printing', prefs, now: at(12), readingThisChat: false })
        .show,
    ).toBe(false);
    expect(
      foregroundBannerPolicy({ category: 'chat', prefs, now: at(12), readingThisChat: true }).show,
    ).toBe(false);
  });

  it('hides the banner of a muted chat', () => {
    expect(
      foregroundBannerPolicy({
        category: 'chat',
        prefs,
        now: at(12),
        readingThisChat: false,
        chatMuted: true,
      }),
    ).toEqual({ show: false, sound: false, badge: false });
  });

  it('is silent but visible in quiet hours, and normal otherwise', () => {
    expect(
      foregroundBannerPolicy({ category: 'chat', prefs, now: at(23), readingThisChat: false }),
    ).toEqual({
      show: true,
      sound: false,
      badge: true,
    });
    expect(
      foregroundBannerPolicy({ category: 'chat', prefs, now: at(12), readingThisChat: false }),
    ).toEqual({
      show: true,
      sound: true,
      badge: true,
    });
    expect(
      foregroundBannerPolicy({ category: null, prefs: null, now: at(12), readingThisChat: false })
        .show,
    ).toBe(true);
  });
});

describe('summary and badges', () => {
  it('reads the supported shapes', () => {
    expect(normalizeSummary({ total: 5, by_category: { chat: 3, printing: 2 } })).toEqual({
      total: 5,
      byCategory: { chat: 3, printing: 2 },
    });
    expect(normalizeSummary({ categories: [{ category: 'support', unread: 4 }] })).toEqual({
      total: 4,
      byCategory: { support: 4 },
    });
    expect(normalizeSummary({ unread_by_category: { groups: { count: 2 } } }).byCategory).toEqual({
      groups: 2,
    });
    expect(normalizeSummary(undefined)).toEqual({ total: 0, byCategory: {} });
    expect(normalizeSummary({ by_category: { chat: -3, groups: 'x' } }).total).toBe(0);
  });

  it('splits unread numbers onto the tabs', () => {
    const summary = normalizeSummary({
      total: 9,
      by_category: { chat: 2, groups: 1, printing: 3, support: 3 },
    });

    expect(tabBadgeCounts({ summary, chatUnread: 0 })).toEqual({
      groups: 3,
      printing: 3,
      profile: 3,
    });
    // the live chat counter can be ahead of the last summary
    expect(tabBadgeCounts({ summary, chatUnread: 5 }).groups).toBe(6);
  });
});

describe('tap routing by category', () => {
  it('opens the chat room, order or ticket named in the data, else the list', () => {
    expect(intentFromPushData({ kind: 'chat', group_id: 7 })).toEqual({
      kind: 'groupChat',
      groupId: '7',
    });
    expect(intentFromPushData({ kind: 'chat' })).toEqual({ kind: 'groups' });
    expect(intentFromPushData({ category: 'printing', order_id: '12' })).toEqual({
      kind: 'printingOrder',
      orderId: '12',
    });
    expect(intentFromPushData({ category: 'printing' })).toEqual({ kind: 'printingOrders' });
    expect(intentFromPushData({ category: 'support', ticket_id: 3 })).toEqual({
      kind: 'supportTicket',
      ticketId: '3',
    });
    expect(intentFromPushData({ kind: 'enrollment' })).toEqual({ kind: 'groups' });
    expect(intentFromPushData({ category: 'verification' })).toEqual({ kind: 'verification' });
    expect(intentFromPushData({ kind: 'weird' })).toBeNull();
  });
});
