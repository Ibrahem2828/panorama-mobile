jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { extra: { apiBaseUrl: 'https://api.example.com' } } },
}));
jest.mock('../authTokenStorage', () => ({
  clearAuthTokens: jest.fn(async () => undefined),
  getStoredAuthTokens: jest.fn(),
  saveAuthTokens: jest.fn(async () => undefined),
}));
jest.mock('../../../../api/services/auth.service', () => ({
  refreshToken: jest.fn(),
}));

import { ApiClientError } from '../../../../api/errors';
import * as authService from '../../../../api/services/auth.service';
import { isDefinitiveRefreshRejection, refreshAccessToken } from '../authSessionService';
import { clearAuthTokens, getStoredAuthTokens, saveAuthTokens } from '../authTokenStorage';

const refreshToken = authService.refreshToken as jest.Mock;
const storedTokens = getStoredAuthTokens as jest.Mock;

function failure(status: number | undefined, code: ApiClientError['code']) {
  return new ApiClientError({ code, status, message: 'x' });
}

beforeEach(() => {
  jest.clearAllMocks();
  storedTokens.mockResolvedValue({ accessToken: 'a', refreshToken: 'r' });
});

describe('refreshAccessToken', () => {
  it('stores and returns the rotated tokens on success', async () => {
    refreshToken.mockResolvedValue({ access: 'a2', refresh: 'r2' });

    await expect(refreshAccessToken()).resolves.toEqual({ accessToken: 'a2', refreshToken: 'r2' });
    expect(saveAuthTokens).toHaveBeenCalledWith({ accessToken: 'a2', refreshToken: 'r2' });
  });

  it.each([
    ['network error', undefined, 'NETWORK_ERROR'],
    ['timeout', undefined, 'TIMEOUT'],
    ['500', 500, 'SERVER_ERROR'],
    ['503', 503, 'SERVER_ERROR'],
    ['429', 429, 'RATE_LIMITED'],
  ] as const)('keeps the session on a transient failure (%s)', async (_name, status, code) => {
    refreshToken.mockRejectedValue(failure(status, code));

    await expect(refreshAccessToken()).rejects.toMatchObject({ code });
    expect(clearAuthTokens).not.toHaveBeenCalled();
  });

  it.each([400, 401])('clears the session on a definitive %s', async (status) => {
    refreshToken.mockRejectedValue(
      failure(status, status === 401 ? 'UNAUTHORIZED' : 'VALIDATION_ERROR'),
    );

    await expect(refreshAccessToken()).resolves.toBeNull();
    expect(clearAuthTokens).toHaveBeenCalledTimes(1);
  });

  it('returns null without calling the server when no tokens are stored', async () => {
    storedTokens.mockResolvedValue(null);

    await expect(refreshAccessToken()).resolves.toBeNull();
    expect(refreshToken).not.toHaveBeenCalled();
  });
});

describe('isDefinitiveRefreshRejection', () => {
  it('is true only for 400 and 401', () => {
    expect(isDefinitiveRefreshRejection(failure(401, 'UNAUTHORIZED'))).toBe(true);
    expect(isDefinitiveRefreshRejection(failure(400, 'VALIDATION_ERROR'))).toBe(true);
    expect(isDefinitiveRefreshRejection(failure(403, 'FORBIDDEN'))).toBe(false);
    expect(isDefinitiveRefreshRejection(failure(500, 'SERVER_ERROR'))).toBe(false);
    expect(isDefinitiveRefreshRejection(new TypeError('Network request failed'))).toBe(false);
  });
});
