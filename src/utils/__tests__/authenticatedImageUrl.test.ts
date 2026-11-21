jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { extra: { apiBaseUrl: 'https://api.example.com' } } },
}));

import { authenticatedImageUrl } from '../authenticatedImageUrl';

const buildApiUrl = (path: string) => `https://api.example.com${path}`;

describe('authenticatedImageUrl', () => {
  it.each([
    '/api/v1/groups/12/image/?v=1700000000',
    '/api/v1/announcements/7/image/?v=1700000000',
    '/api/v1/printing/products/3/image/?v=1700000000',
    '/api/v1/store/images/5/?v=1&variant=thumb',
    '/api/v1/store/brands/3/logo/?v=9',
  ])('accepts %s and keeps path and query on our own API address', (path) => {
    expect(authenticatedImageUrl(path)).toBe(buildApiUrl(path));
  });

  it('drops the host the server wrote into the payload', () => {
    expect(authenticatedImageUrl('https://api.panorama.test/api/v1/groups/12/image/?v=5')).toBe(
      buildApiUrl('/api/v1/groups/12/image/?v=5'),
    );
    expect(authenticatedImageUrl('http://evil.example/api/v1/announcements/1/image/')).toBe(
      buildApiUrl('/api/v1/announcements/1/image/'),
    );
  });

  it.each([
    'https://x.test/media/groups/a.png',
    '/media/groups/a.png',
    '/api/v1/groups/12/',
    '/api/v1/groups/abc/image/',
    '/api/v1/groups/12/image/../../auth/me/',
    '/api/v1/groups/12/image/extra/',
    '/api/v1/printing/products/',
    '/api/v1/printing/products/3/',
    '/api/v1/announcements/image/',
    '/api/v1/auth/me/',
    'https://evil.example/?u=/api/v1/groups/1/image/',
    '//evil.example/api/v1/groups/1/image/',
    'javascript:/api/v1/groups/1/image/',
    '',
    '   ',
  ])('rejects %j so no token is sent', (url) => {
    expect(authenticatedImageUrl(url)).toBeNull();
  });

  it('returns null for missing values', () => {
    expect(authenticatedImageUrl(null)).toBeNull();
    expect(authenticatedImageUrl(undefined)).toBeNull();
  });
});
