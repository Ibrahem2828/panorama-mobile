import {
  choiceToRequest,
  isEffectivelyMuted,
  msUntilExpiry,
  normalizeMutedChats,
  normalizeMutePref,
  prefForChoice,
  sectionMutedChats,
  shouldShowMutedSearch,
} from '../mute';

const NOW = Date.parse('2026-10-30T12:00:00Z');
const HOUR = 60 * 60 * 1000;

describe('isEffectivelyMuted', () => {
  it('is false without a preference or when not muted', () => {
    expect(isEffectivelyMuted(undefined, NOW)).toBe(false);
    expect(isEffectivelyMuted({ isMuted: false, mutedUntil: null }, NOW)).toBe(false);
  });

  it('is true for a mute without an end', () => {
    expect(isEffectivelyMuted({ isMuted: true, mutedUntil: null }, NOW)).toBe(true);
  });

  it('counts a timed mute only until it expires', () => {
    const pref = { isMuted: true, mutedUntil: new Date(NOW + HOUR).toISOString() };

    expect(isEffectivelyMuted(pref, NOW)).toBe(true);
    expect(isEffectivelyMuted(pref, NOW + HOUR)).toBe(false);
    expect(isEffectivelyMuted(pref, NOW + 2 * HOUR)).toBe(false);
  });

  it('trusts the server flag when the end time is unreadable', () => {
    expect(isEffectivelyMuted({ isMuted: true, mutedUntil: 'soon' }, NOW)).toBe(true);
  });
});

describe('prefForChoice / choiceToRequest', () => {
  it('computes the optimistic end of each duration', () => {
    expect(prefForChoice('8h', NOW)).toEqual({
      isMuted: true,
      mutedUntil: new Date(NOW + 8 * HOUR).toISOString(),
    });
    expect(prefForChoice('1w', NOW).mutedUntil).toBe(new Date(NOW + 168 * HOUR).toISOString());
    expect(prefForChoice('forever', NOW)).toEqual({ isMuted: true, mutedUntil: null });
    expect(prefForChoice('unmute', NOW)).toEqual({ isMuted: false, mutedUntil: null });
  });

  it('sends mute_for only with a mute', () => {
    expect(choiceToRequest('8h')).toEqual({ isMuted: true, muteFor: '8h' });
    expect(choiceToRequest('forever')).toEqual({ isMuted: true, muteFor: 'forever' });
    expect(choiceToRequest('unmute')).toEqual({ isMuted: false });
  });
});

describe('normalizeMutePref', () => {
  it('drops muted_until when not muted and tolerates garbage', () => {
    expect(normalizeMutePref({ is_muted: false, muted_until: '2026-01-01T00:00:00Z' })).toEqual({
      isMuted: false,
      mutedUntil: null,
    });
    expect(normalizeMutePref({ is_muted: true, muted_until: '2026-11-01T00:00:00Z' })).toEqual({
      isMuted: true,
      mutedUntil: '2026-11-01T00:00:00Z',
    });
    expect(normalizeMutePref(null)).toEqual({ isMuted: false, mutedUntil: null });
  });
});

const ROWS = [
  {
    group_id: 1,
    name: 'مجتمع كلية الهندسة المعلوماتية - السنة الأولى',
    kind: 'community',
    is_muted: false,
    muted_until: null,
  },
  { group_id: 2, name: 'أنظمة التشغيل', kind: 'subject', is_muted: true, muted_until: null },
  { group_id: '3', name: 'قواعد المعطيات', kind: 'subject', is_muted: false, muted_until: null },
  {
    group_id: 4,
    name: 'مجتمع كلية الطب',
    kind: 'community',
    is_muted: true,
    muted_until: '2026-11-02T00:00:00Z',
  },
];

describe('muted chat list', () => {
  it('normalizes rows and skips malformed ones', () => {
    const items = normalizeMutedChats([...ROWS, null, { name: 'no id' }]);

    expect(items).toHaveLength(4);
    expect(items[2]?.groupId).toBe('3');
    expect(items[1]?.pref).toEqual({ isMuted: true, mutedUntil: null });
    expect(normalizeMutedChats({ results: [ROWS[0]] })).toHaveLength(1);
    expect(normalizeMutedChats('nope')).toEqual([]);
  });

  it('splits communities from subject groups', () => {
    const { communities, subjects } = sectionMutedChats(normalizeMutedChats(ROWS));

    expect(communities.map((item) => item.groupId)).toEqual(['1', '4']);
    expect(subjects.map((item) => item.groupId)).toEqual(['2', '3']);
  });

  it('filters by name in both sections, ignoring Arabic letter variants', () => {
    const items = normalizeMutedChats(ROWS);

    expect(sectionMutedChats(items, 'انظمه').subjects.map((item) => item.groupId)).toEqual(['2']);
    expect(sectionMutedChats(items, 'الطب').communities.map((item) => item.groupId)).toEqual(['4']);
    expect(sectionMutedChats(items, 'zzz')).toEqual({ communities: [], subjects: [] });
  });

  it('shows the search box only for long lists', () => {
    expect(shouldShowMutedSearch(8)).toBe(false);
    expect(shouldShowMutedSearch(9)).toBe(true);
  });
});

describe('msUntilExpiry', () => {
  it('returns the wait for an active timed mute and null otherwise', () => {
    expect(
      msUntilExpiry({ isMuted: true, mutedUntil: new Date(NOW + HOUR).toISOString() }, NOW),
    ).toBe(HOUR);
    expect(msUntilExpiry({ isMuted: true, mutedUntil: null }, NOW)).toBeNull();
    expect(
      msUntilExpiry({ isMuted: true, mutedUntil: new Date(NOW - HOUR).toISOString() }, NOW),
    ).toBeNull();
    expect(msUntilExpiry(undefined, NOW)).toBeNull();
  });
});
