import {
  getAudienceKey,
  isEndingSoon,
  mergeAnnouncementPages,
  normalizeAnnouncement,
  parseStoredReadIds,
  rememberReadId,
  toSafeExternalUrl,
} from '../services/announcementModel';
import type { AnnouncementItem } from '../types';

function item(id: number, overrides: Partial<AnnouncementItem> = {}): AnnouncementItem {
  return {
    id,
    title: `t${id}`,
    body: null,
    imageUrl: null,
    linkUrl: null,
    startsAt: null,
    endsAt: null,
    createdAt: null,
    createdByName: null,
    targetUserType: null,
    academicTargets: [],
    ...overrides,
  };
}

describe('toSafeExternalUrl', () => {
  it('keeps https urls and rejects other schemes', () => {
    expect(toSafeExternalUrl('https://example.com/a.png')).toBe('https://example.com/a.png');
    expect(toSafeExternalUrl('http://example.com')).toBeNull();
    expect(toSafeExternalUrl('javascript:alert(1)')).toBeNull();
    expect(toSafeExternalUrl('   ')).toBeNull();
    expect(toSafeExternalUrl(undefined)).toBeNull();
  });
});

describe('normalizeAnnouncement', () => {
  it('maps the contract fields and academic targets', () => {
    const result = normalizeAnnouncement({
      id: 4,
      title: '  Exams  ',
      description: 'Body',
      image: 'https://cdn.example.com/x.jpg',
      link: '',
      starts_at: '2026-01-01T00:00:00Z',
      target_user_type: 'students',
      target_faculty: 7,
      target_major: null,
    });

    expect(result.title).toBe('Exams');
    expect(result.body).toBe('Body');
    expect(result.imageUrl).toBe('https://cdn.example.com/x.jpg');
    expect(result.linkUrl).toBeNull();
    expect(result.startsAt).toBe('2026-01-01T00:00:00Z');
    expect(result.academicTargets).toEqual(['faculty']);
  });
});

describe('getAudienceKey', () => {
  it('maps backend audiences', () => {
    expect(getAudienceKey(undefined)).toBe('all');
    expect(getAudienceKey('verified_students')).toBe('verified');
    expect(getAudienceKey('normal_users')).toBe('normal');
    expect(getAudienceKey('something_new')).toBe('custom');
  });
});

describe('isEndingSoon', () => {
  const now = new Date('2026-05-01T12:00:00Z').getTime();

  it('flags announcements ending within 48 hours only', () => {
    expect(isEndingSoon(item(1, { endsAt: '2026-05-02T12:00:00Z' }), now)).toBe(true);
    expect(isEndingSoon(item(1, { endsAt: '2026-05-10T12:00:00Z' }), now)).toBe(false);
    expect(isEndingSoon(item(1, { endsAt: '2026-04-30T12:00:00Z' }), now)).toBe(false);
    expect(isEndingSoon(item(1), now)).toBe(false);
  });
});

describe('mergeAnnouncementPages', () => {
  it('appends new items and drops duplicates', () => {
    const merged = mergeAnnouncementPages([item(1), item(2)], [item(2), item(3)]);

    expect(merged.map((entry) => entry.id)).toEqual([1, 2, 3]);
  });

  it('returns the same array when nothing is new', () => {
    const current = [item(1)];

    expect(mergeAnnouncementPages(current, [item(1)])).toBe(current);
  });
});

describe('read markers', () => {
  it('remembers an id once and caps the list', () => {
    expect(rememberReadId(['1'], 1)).toEqual(['1']);
    expect(rememberReadId(['1'], 2)).toEqual(['1', '2']);

    const many = Array.from({ length: 300 }, (_, index) => String(index));

    expect(rememberReadId(many, 'new')).toHaveLength(300);
    expect(rememberReadId(many, 'new').at(-1)).toBe('new');
  });

  it('parses stored ids defensively', () => {
    expect(parseStoredReadIds(null)).toEqual([]);
    expect(parseStoredReadIds('not json')).toEqual([]);
    expect(parseStoredReadIds('{"a":1}')).toEqual([]);
    expect(parseStoredReadIds('["1",2,"3"]')).toEqual(['1', '3']);
  });
});
