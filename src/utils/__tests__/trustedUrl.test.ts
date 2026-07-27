jest.mock('../../config/env', () => ({
  env: {
    apiBaseUrl: 'https://api.example.com',
    isDevelopment: false,
  },
}));

import { isTrustedBackendUrl } from '../trustedUrl';

describe('isTrustedBackendUrl', () => {
  const rule = { pathPrefixes: ['/api/v1/protected-files/'] } as const;

  it('accepts the configured backend origin and protected path', () => {
    expect(isTrustedBackendUrl('https://api.example.com/api/v1/protected-files/token/', rule)).toBe(
      true,
    );
  });

  it('rejects a different origin', () => {
    expect(isTrustedBackendUrl('https://evil.example/api/v1/protected-files/token/', rule)).toBe(
      false,
    );
  });

  it('rejects an unapproved backend path', () => {
    expect(isTrustedBackendUrl('https://api.example.com/media/private.pdf', rule)).toBe(false);
  });
});
