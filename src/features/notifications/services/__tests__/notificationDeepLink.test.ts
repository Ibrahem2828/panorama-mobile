import { normalizeDeepLinkPath, parseDeepLink } from '../notificationDeepLink';

describe('parseDeepLink', () => {
  it.each([
    ['/printing/orders/12', { kind: 'printingOrder', orderId: '12' }],
    ['/ar/announcements/3', { kind: 'announcement', announcementId: '3' }],
    ['/announcements', { kind: 'announcements' }],
    ['/files/9?x=1#top', { kind: 'file', fileId: '9' }],
    ['/groups/4/chat', { kind: 'groupChat', groupId: '4' }],
    ['/groups/4/files', { kind: 'groupFiles', groupId: '4' }],
    ['/groups/my', { kind: 'groups' }],
    ['/support/7/', { kind: 'supportTicket', ticketId: '7' }],
    ['/support/new', { kind: 'supportNew' }],
    ['/profile/settings', { kind: 'settings' }],
    ['panorama://printing/orders/4', { kind: 'printingOrder', orderId: '4' }],
    ['/en/subjects/8', { kind: 'subject', subjectId: '8' }],
  ])('opens %s', (raw, expected) => {
    expect(parseDeepLink(raw)).toEqual(expected);
  });

  it.each([
    'https://evil.example/printing/orders/1',
    '//evil.example/files/1',
    'javascript:alert(1)',
    '/files/1/../2',
    '/files/%31',
    '/files\\1',
    '/unknown/route',
    '/files/abc',
    '/printing/orders/1234567890123',
    '',
    null,
    undefined,
  ])('ignores %s', (raw) => {
    expect(parseDeepLink(raw as string | null | undefined)).toBeNull();
  });

  it('refuses very long links and control characters', () => {
    expect(normalizeDeepLinkPath(`/files/${'1'.repeat(300)}`)).toBeNull();
    expect(normalizeDeepLinkPath('/files/1\n')).toBe('/files/1');
    expect(normalizeDeepLinkPath('/fi\u0000les/1')).toBeNull();
  });
});
