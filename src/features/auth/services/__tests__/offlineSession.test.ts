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
  getCurrentUser: jest.fn(),
  refreshToken: jest.fn(),
  logout: jest.fn(),
}));

import { ApiClientError } from '../../../../api/errors';
import * as authService from '../../../../api/services/auth.service';
import {
  createInMemoryCacheStorage,
  setCacheStorageAdapter,
} from '../../../../offline/cacheStorage';
import { loadSessionSnapshot, saveSessionSnapshot } from '../../../../offline/sessionSnapshot';
import { bootstrapSession, logoutSession } from '../authSessionService';
import { clearAuthTokens, getStoredAuthTokens } from '../authTokenStorage';

const getCurrentUser = authService.getCurrentUser as jest.Mock;
const refreshToken = authService.refreshToken as jest.Mock;
const storedTokens = getStoredAuthTokens as jest.Mock;
const user = { id: 7, email: 'a@b.c', full_name: 'Sara', role: 'student' };

function failure(status: number | undefined, code: ApiClientError['code']) {
  return new ApiClientError({ code, status, message: 'x' });
}

beforeEach(() => {
  jest.clearAllMocks();
  setCacheStorageAdapter(createInMemoryCacheStorage());
  storedTokens.mockResolvedValue({ accessToken: 'a', refreshToken: 'r' });
});

afterAll(() => setCacheStorageAdapter(null));

describe('starting the app without a connection', () => {
  it('saves the profile after a normal start', async () => {
    getCurrentUser.mockResolvedValue(user);

    const result = await bootstrapSession();

    expect(result.session?.user.id).toBe(7);
    expect(result.offline).toBeUndefined();
    await new Promise((resolve) => setImmediate(resolve));
    expect((await loadSessionSnapshot<{ id: number }>())?.user.id).toBe(7);
  });

  it.each([
    ['network error', undefined, 'NETWORK_ERROR'],
    ['timeout', undefined, 'TIMEOUT'],
    ['server error', 503, 'SERVER_ERROR'],
  ] as const)(
    'opens from the saved profile and keeps the tokens (%s)',
    async (_name, status, code) => {
      await saveSessionSnapshot({ id: 7, email: 'a@b.c' });
      getCurrentUser.mockRejectedValue(failure(status, code));

      const result = await bootstrapSession();

      expect(result.offline).toBe(true);
      expect(result.session?.user).toMatchObject({ id: 7 });
      expect(result.session?.tokens).toEqual({ accessToken: 'a', refreshToken: 'r' });
      expect(clearAuthTokens).not.toHaveBeenCalled();
    },
  );

  it('also opens from the saved profile when the token refresh cannot reach the server', async () => {
    await saveSessionSnapshot({ id: 7 });
    getCurrentUser.mockRejectedValue(failure(401, 'UNAUTHORIZED'));
    refreshToken.mockRejectedValue(failure(undefined, 'NETWORK_ERROR'));

    const result = await bootstrapSession();

    expect(result.offline).toBe(true);
    expect(clearAuthTokens).not.toHaveBeenCalled();
  });

  it('does not sign anyone in when nothing was saved (first launch)', async () => {
    getCurrentUser.mockRejectedValue(failure(undefined, 'NETWORK_ERROR'));

    await expect(bootstrapSession()).rejects.toThrow();
    expect(clearAuthTokens).not.toHaveBeenCalled();
  });

  it('ends the session and the saved profile only on a definitive refusal', async () => {
    await saveSessionSnapshot({ id: 7 });
    getCurrentUser.mockRejectedValue(failure(401, 'UNAUTHORIZED'));
    refreshToken.mockRejectedValue(failure(401, 'UNAUTHORIZED'));

    const result = await bootstrapSession();

    expect(result).toEqual({ session: null, sessionExpired: true });
    expect(clearAuthTokens).toHaveBeenCalledTimes(1);
    expect(await loadSessionSnapshot()).toBeNull();
  });

  it('removes the saved profile on sign-out, even when the server cannot be told', async () => {
    await saveSessionSnapshot({ id: 7 });
    (authService.logout as jest.Mock).mockRejectedValue(failure(undefined, 'NETWORK_ERROR'));

    await logoutSession({ accessToken: 'a', refreshToken: 'r' });

    expect(clearAuthTokens).toHaveBeenCalled();
    expect(await loadSessionSnapshot()).toBeNull();
  });
});
