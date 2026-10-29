import { buildCacheKey, isCacheablePath } from '../cachePolicy';

describe('isCacheablePath', () => {
  it.each([
    '/api/v1/auth/me/',
    '/api/v1/students/me/profile/',
    '/api/v1/groups/my/',
    '/api/v1/groups/12/',
    '/api/v1/groups/12/files/',
    '/api/v1/groups/12/messages/',
    '/api/v1/files/',
    '/api/v1/files/7/',
    '/api/v1/files/7/viewer/manifest/',
    '/api/v1/printing/options/',
    '/api/v1/printing/products/',
    '/api/v1/printing/orders/my/',
    '/api/v1/printing/orders/my/3/',
    '/api/v1/notifications/',
    '/api/v1/notifications/summary/',
    '/api/v1/enrollment/requests/',
    '/api/v1/announcements/',
    '/api/v1/lectures/',
    '/api/v1/lectures/4/notes/',
    '/api/v1/my-notes/',
    '/api/v1/support/tickets/my/',
    '/api/v1/support/tickets/9/',
    '/api/v1/academic/current-term/',
  ])('keeps %s', (path) => {
    expect(isCacheablePath(path)).toBe(true);
  });

  it.each([
    '/api/v1/files/7/access-ticket/',
    '/api/v1/groups/12/chat-ticket/',
    '/api/v1/groups/12/messages/5/attachment-ticket/',
    '/api/v1/groups/12/whatsapp-launch/',
    '/api/v1/support/messages/5/attachment-ticket/',
    '/api/v1/printing/items/5/access-ticket/',
    '/api/v1/lectures/4/viewer/session/',
    '/api/v1/lectures/4/viewer/pages/1/',
    '/api/v1/files/7/viewer/pages/2/',
    '/api/v1/lectures/4/processing-status/',
    '/api/v1/auth/login/',
    '/api/v1/auth/token/refresh/',
    '/api/v1/notifications/device-tokens/',
    '/api/v1/account/deletion/status/',
    '/api/v1/students/me/term-confirmation/',
    '/api/v1/dashboard/academic/current-term/',
    '/api/v1/protected-files/abc/',
    '/api/v1/unknown/thing/',
  ])('never keeps %s', (path) => {
    expect(isCacheablePath(path)).toBe(false);
  });

  it('ignores the query string when matching', () => {
    expect(isCacheablePath('/api/v1/files/?page=2')).toBe(true);
  });
});

describe('buildCacheKey', () => {
  it('sorts query parameters and drops empty ones so equal requests share an entry', () => {
    expect(buildCacheKey('/api/v1/files/', { page: 2, search: '', ordering: '-created_at' })).toBe(
      '/api/v1/files/?ordering=-created_at&page=2',
    );
    expect(buildCacheKey('/api/v1/files/', { ordering: '-created_at', page: 2 })).toBe(
      buildCacheKey('/api/v1/files/', { page: 2, ordering: '-created_at', skip: undefined }),
    );
    expect(buildCacheKey('/api/v1/files/')).toBe('/api/v1/files/');
  });
});
