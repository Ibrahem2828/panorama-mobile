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

import { createInMemoryCacheStorage, setCacheStorageAdapter } from '../../offline/cacheStorage';
import { setCacheScope } from '../../offline/cacheScope';
import { useNetworkStore } from '../../offline/networkStore';
import { clearAllCaches, readCache } from '../../offline/responseCache';
import { registerApiAuthBridge } from '../authBridge';
import { apiClient } from '../client';
import { errorEnvelope, installFetchMock, successEnvelope } from './testUtils';

const fetchMock = installFetchMock();
const storage = createInMemoryCacheStorage();

function flush() {
  return new Promise((resolve) => setImmediate(resolve));
}

beforeEach(async () => {
  jest.useRealTimers();
  fetchMock.mockReset();
  setCacheStorageAdapter(storage);
  await clearAllCaches();
  setCacheScope('7');
  useNetworkStore.setState({ isOnline: true, lastCacheServeAt: 0, lastCachedSavedAt: null });
  registerApiAuthBridge({
    getAccessToken: () => 'access',
    refreshAccessToken: async () => null,
    onSessionExpired: () => undefined,
  });
});

afterAll(() => {
  setCacheScope(null);
  setCacheStorageAdapter(null);
});

describe('offline reads', () => {
  it('saves a successful GET and serves it when the network fails', async () => {
    fetchMock.mockResolvedValueOnce(successEnvelope({ results: ['a'] }));
    await expect(apiClient.get('/api/v1/groups/my/', { authToken: 'a' })).resolves.toEqual({
      results: ['a'],
    });
    await flush();

    fetchMock.mockRejectedValueOnce(new TypeError('Network request failed'));

    await expect(apiClient.get('/api/v1/groups/my/', { authToken: 'a' })).resolves.toEqual({
      results: ['a'],
    });
    expect(useNetworkStore.getState().lastCachedSavedAt).not.toBeNull();
  });

  it('answers from the saved copy at once, without a request, when the device is offline', async () => {
    fetchMock.mockResolvedValueOnce(successEnvelope({ n: 1 }));
    await apiClient.get('/api/v1/notifications/', { authToken: 'a' });
    await flush();
    fetchMock.mockClear();

    useNetworkStore.setState({ isOnline: false });

    await expect(apiClient.get('/api/v1/notifications/', { authToken: 'a' })).resolves.toEqual({
      n: 1,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('fails fast with the offline message when offline and nothing was saved', async () => {
    useNetworkStore.setState({ isOnline: false });

    await expect(apiClient.get('/api/v1/files/', { authToken: 'a' })).rejects.toMatchObject({
      code: 'NETWORK_ERROR',
      details: { offline: true },
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('serves the saved copy on a server error but never on a client error', async () => {
    fetchMock.mockResolvedValueOnce(successEnvelope({ ok: 1 }));
    await apiClient.get('/api/v1/files/', { authToken: 'a' });
    await flush();

    fetchMock.mockResolvedValueOnce(errorEnvelope(503, 'SERVER_ERROR'));
    await expect(apiClient.get('/api/v1/files/', { authToken: 'a' })).resolves.toEqual({ ok: 1 });

    fetchMock.mockResolvedValueOnce(errorEnvelope(403, 'FORBIDDEN'));
    await expect(apiClient.get('/api/v1/files/', { authToken: 'a' })).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
  });

  it('shows the saved copy after the soft timeout while the request keeps running', async () => {
    fetchMock.mockResolvedValueOnce(successEnvelope({ v: 'old' }));
    await apiClient.get('/api/v1/announcements/', { authToken: 'a' });
    await flush();

    jest.useFakeTimers();
    let release: (value: Response) => void = () => undefined;

    fetchMock.mockImplementationOnce(
      () =>
        new Promise<Response>((resolve) => {
          release = resolve;
        }),
    );

    const pending = apiClient.get('/api/v1/announcements/', { authToken: 'a' });

    await jest.advanceTimersByTimeAsync(3100);
    await expect(pending).resolves.toEqual({ v: 'old' });

    jest.useRealTimers();
    release(successEnvelope({ v: 'new' }));
    await flush();
    await flush();

    expect((await readCache<{ v: string }>('7', '/api/v1/announcements/'))?.data.v).toBe('new');
  });

  it('does not save or serve anything without a signed-in scope', async () => {
    setCacheScope(null);
    fetchMock.mockResolvedValueOnce(successEnvelope({ a: 1 }));
    await apiClient.get('/api/v1/groups/my/', { authToken: 'a' });
    await flush();

    expect(await storage.getAllKeys()).toEqual([]);

    fetchMock.mockRejectedValueOnce(new TypeError('Network request failed'));
    await expect(apiClient.get('/api/v1/groups/my/', { authToken: 'a' })).rejects.toMatchObject({
      code: 'NETWORK_ERROR',
    });
  });

  it('never saves paths outside the allowlist or when noCache is set', async () => {
    fetchMock.mockResolvedValue(successEnvelope({ ticket: 'secret' }));

    await apiClient.get('/api/v1/files/3/access-ticket/', { authToken: 'a' });
    await apiClient.get('/api/v1/files/', { authToken: 'a', noCache: true });
    await flush();

    expect(await storage.getAllKeys()).toEqual([]);
  });
});

describe('offline writes', () => {
  it('never caches a write response', async () => {
    fetchMock.mockResolvedValue(successEnvelope({ id: 1 }, 201));

    await apiClient.post('/api/v1/support/tickets/', { subject: 's' }, { authToken: 'a' });
    await flush();

    expect(await storage.getAllKeys()).toEqual([]);
  });

  it('fails a write at once with a clear error when the device is offline, without sending it', async () => {
    useNetworkStore.setState({ isOnline: false });

    await expect(
      apiClient.post(
        '/api/v1/groups/1/messages/',
        { content: 'hi' },
        { authToken: 'a', idempotencyKey: 'k' },
      ),
    ).rejects.toMatchObject({ code: 'NETWORK_ERROR', details: { offline: true } });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
