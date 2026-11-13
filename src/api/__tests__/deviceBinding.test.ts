jest.mock('react-native', () => ({
  Platform: { OS: 'android' },
  I18nManager: { isRTL: true, forceRTL: jest.fn(), allowRTL: jest.fn() },
  AppState: { currentState: 'active', addEventListener: jest.fn(() => ({ remove: jest.fn() })) },
}));
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { extra: { apiBaseUrl: 'https://api.example.com' } } },
}));
jest.mock('expo-application', () => ({
  nativeApplicationVersion: '2.1.0',
  nativeBuildVersion: '210',
}));

const mockSecureStore = new Map<string, string>();
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string) => mockSecureStore.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => {
    mockSecureStore.set(key, value);
  }),
}));
jest.mock('expo-device', () => ({ brand: 'Google', modelName: 'Pixel 8' }));

import * as SecureStore from 'expo-secure-store';

import { registerApiAuthBridge } from '../authBridge';
import { apiClient } from '../client';
import {
  buildDeviceName,
  DEVICE_ID_STORAGE_KEY,
  ensureDeviceId,
  getDeviceHeaders,
  resetDeviceIdentityForTests,
  sanitizeDeviceName,
} from '../deviceIdentity';
import { parseDeviceMismatch, parseDeviceMismatchDetails } from '../deviceBinding';
import { errorEnvelope, headersOf, installFetchMock, successEnvelope } from './testUtils';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/u;
const fetchMock = installFetchMock();

const mismatchErrors = {
  bound_device: { name: 'Pixel 7', platform: 'android', last_seen_at: '2026-11-10T10:00:00Z' },
  can_switch: true,
  switches_remaining: 1,
  device_switch_token: 'switch-token',
  device_switch_token_expires_in: 600,
};

beforeEach(() => {
  fetchMock.mockReset();
  mockSecureStore.clear();
  jest.clearAllMocks();
  resetDeviceIdentityForTests();
});

describe('device identity', () => {
  it('creates a UUID once, keeps it in secure storage and reuses it', async () => {
    const first = await ensureDeviceId();

    expect(first).toMatch(UUID);
    expect(mockSecureStore.get(DEVICE_ID_STORAGE_KEY)).toBe(first);

    resetDeviceIdentityForTests();

    await expect(ensureDeviceId()).resolves.toBe(first);
    expect(SecureStore.setItemAsync).toHaveBeenCalledTimes(1);
  });

  it('replaces a stored value that is not a UUID', async () => {
    mockSecureStore.set(DEVICE_ID_STORAGE_KEY, 'not-a-uuid');

    const id = await ensureDeviceId();

    expect(id).toMatch(UUID);
    expect(mockSecureStore.get(DEVICE_ID_STORAGE_KEY)).toBe(id);
  });

  it('sends id, name and platform headers', async () => {
    const id = await ensureDeviceId();

    expect(getDeviceHeaders()).toEqual({
      'X-Panorama-Device-Id': id,
      'X-Panorama-Device-Name': 'Google Pixel 8',
      'X-Panorama-Platform': 'android',
    });
  });

  it('keeps the name printable ASCII and within 80 characters', () => {
    expect(sanitizeDeviceName('Galaxy\u0000 S24\n Ultra عربي')).toBe('Galaxy S24 Ultra');
    expect(sanitizeDeviceName('x'.repeat(200))).toHaveLength(80);
    expect(buildDeviceName({ brand: 'samsung', modelName: 'Samsung Galaxy S24' })).toBe(
      'Samsung Galaxy S24',
    );
    expect(buildDeviceName({ brand: null, modelName: null })).toBe('');
  });
});

describe('central client', () => {
  it('sends the device headers on login, refresh and authenticated requests', async () => {
    fetchMock.mockResolvedValue(successEnvelope({}));

    await apiClient.post('/api/v1/auth/login/', { identifier: 'a', password: 'b' });
    await apiClient.post('/api/v1/auth/token/refresh/', { refresh: 'r' });
    await apiClient.get('/api/v1/groups/my/', { authToken: 'access' });

    const id = await ensureDeviceId();

    for (const index of [0, 1, 2]) {
      const headers = headersOf(fetchMock, index);

      expect(headers['X-Panorama-Device-Id']).toBe(id);
      expect(headers['X-Panorama-Platform']).toBe('android');
      expect(headers['X-Panorama-Device-Name']).toBe('Google Pixel 8');
    }
  });

  it('signs out at once when an authenticated request says another phone took the account', async () => {
    const onDeviceReplaced = jest.fn();
    const refreshAccessToken = jest.fn(async () => 'new');

    registerApiAuthBridge({
      getAccessToken: () => 'access',
      refreshAccessToken,
      onSessionExpired: jest.fn(),
      onDeviceReplaced,
    });
    fetchMock.mockResolvedValue(errorEnvelope(401, 'DEVICE_MISMATCH'));

    await expect(
      apiClient.get('/api/v1/groups/my/', { authToken: 'access' }),
    ).rejects.toMatchObject({
      errorCode: 'DEVICE_MISMATCH',
    });

    expect(onDeviceReplaced).toHaveBeenCalledTimes(1);
    expect(refreshAccessToken).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('does not sign anyone out for a mismatch on a request without a session (login)', async () => {
    const onDeviceReplaced = jest.fn();

    registerApiAuthBridge({
      getAccessToken: () => null,
      refreshAccessToken: async () => null,
      onSessionExpired: jest.fn(),
      onDeviceReplaced,
    });
    fetchMock.mockResolvedValue(errorEnvelope(409, 'DEVICE_MISMATCH', mismatchErrors));

    await expect(
      apiClient.post('/api/v1/auth/login/', { identifier: 'a', password: 'b' }),
    ).rejects.toMatchObject({ errorCode: 'DEVICE_MISMATCH', status: 409 });
    expect(onDeviceReplaced).not.toHaveBeenCalled();
  });

  it('works unchanged when the server does not enforce binding (plain 401 still refreshes)', async () => {
    const refreshAccessToken = jest.fn(async () => 'fresh');

    registerApiAuthBridge({
      getAccessToken: () => 'access',
      refreshAccessToken,
      onSessionExpired: jest.fn(),
      onDeviceReplaced: jest.fn(),
    });
    fetchMock
      .mockResolvedValueOnce(errorEnvelope(401, 'UNAUTHORIZED'))
      .mockResolvedValueOnce(successEnvelope({ ok: true }));

    await expect(apiClient.get('/api/v1/groups/my/', { authToken: 'access' })).resolves.toEqual({
      ok: true,
    });
    expect(refreshAccessToken).toHaveBeenCalledTimes(1);
  });
});

describe('mismatch details', () => {
  it('parses the bound device and the switch offer from a login refusal', async () => {
    registerApiAuthBridge({
      getAccessToken: () => null,
      refreshAccessToken: async () => null,
      onSessionExpired: jest.fn(),
    });
    fetchMock.mockResolvedValue(errorEnvelope(409, 'DEVICE_MISMATCH', mismatchErrors));

    const error = await apiClient
      .post('/api/v1/auth/login/', { identifier: 'a', password: 'b' })
      .catch((caught: unknown) => caught);

    expect(parseDeviceMismatch(error)).toEqual({
      boundDevice: { name: 'Pixel 7', platform: 'android', lastSeenAt: '2026-11-10T10:00:00Z' },
      canSwitch: true,
      switchesRemaining: 1,
      switchToken: 'switch-token',
      switchTokenExpiresInSeconds: 600,
    });
  });

  it('cannot switch without a token or when the server says no', () => {
    expect(
      parseDeviceMismatchDetails({
        ...mismatchErrors,
        can_switch: false,
        switches_remaining: 0,
        device_switch_token: null,
      }),
    ).toMatchObject({ canSwitch: false, switchesRemaining: 0, switchToken: null });
    expect(parseDeviceMismatchDetails(undefined)).toMatchObject({
      canSwitch: false,
      boundDevice: { name: '', platform: '', lastSeenAt: null },
    });
  });
});
