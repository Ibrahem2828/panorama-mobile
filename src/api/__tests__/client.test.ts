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

import { registerApiAuthBridge } from '../authBridge';
import { apiClient } from '../client';
import { ApiClientError } from '../errors';
import { IDEMPOTENCY_IN_PROGRESS_DELAYS_MS } from '../idempotency';
import { registerLifecycleHandler } from '../lifecycleBridge';
import { errorEnvelope, headersOf, installFetchMock, successEnvelope } from './testUtils';

const fetchMock = installFetchMock();

beforeEach(() => {
  fetchMock.mockReset();
  registerLifecycleHandler(null);
  registerApiAuthBridge({
    getAccessToken: () => 'access',
    refreshAccessToken: async () => null,
    onSessionExpired: () => undefined,
  });
});

describe('request headers', () => {
  it('announces platform, version and build on every request', async () => {
    fetchMock.mockResolvedValue(successEnvelope({ ok: true }));

    await apiClient.get('/api/v1/health/');

    const headers = headersOf(fetchMock, 0);
    expect(['android', 'ios']).toContain(headers['X-App-Platform']);
    expect(headers['X-App-Version']).toBe('2.1.0');
    expect(headers['X-App-Build']).toBe('210');
  });

  it('sends the Idempotency-Key header only when one is given', async () => {
    fetchMock.mockResolvedValue(successEnvelope({}));

    await apiClient.post('/api/v1/feedback/', { a: 1 }, { idempotencyKey: 'key-1' });
    await apiClient.post('/api/v1/feedback/', { a: 1 });

    expect(headersOf(fetchMock, 0)['Idempotency-Key']).toBe('key-1');
    expect(headersOf(fetchMock, 1)['Idempotency-Key']).toBeUndefined();
  });
});

describe('lifecycle errors', () => {
  it('throws a typed MAINTENANCE_MODE error and reports it globally', async () => {
    const handler = jest.fn();
    registerLifecycleHandler(handler);
    fetchMock.mockResolvedValue(errorEnvelope(503, 'MAINTENANCE_MODE', { title_en: 'Down' }));

    await expect(apiClient.get('/api/v1/groups/my/')).rejects.toMatchObject({
      code: 'MAINTENANCE_MODE',
      status: 503,
    });
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ code: 'MAINTENANCE_MODE' }));
  });

  it('throws a typed APP_UPDATE_REQUIRED error for 426', async () => {
    const handler = jest.fn();
    registerLifecycleHandler(handler);
    fetchMock.mockResolvedValue(
      errorEnvelope(426, 'APP_UPDATE_REQUIRED', { store_url: 'https://store.example/app' }),
    );

    await expect(apiClient.get('/api/v1/groups/my/')).rejects.toMatchObject({
      code: 'APP_UPDATE_REQUIRED',
    });
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'APP_UPDATE_REQUIRED',
        details: { store_url: 'https://store.example/app' },
      }),
    );
  });

  it('does not report ordinary errors as lifecycle events', async () => {
    const handler = jest.fn();
    registerLifecycleHandler(handler);
    fetchMock.mockResolvedValue(errorEnvelope(500, 'SERVER_ERROR'));

    await expect(apiClient.get('/api/v1/groups/my/')).rejects.toBeInstanceOf(ApiClientError);
    expect(handler).not.toHaveBeenCalled();
  });
});

describe('idempotency 409 handling', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('waits and re-sends the SAME key while the first attempt is in progress', async () => {
    fetchMock
      .mockResolvedValueOnce(errorEnvelope(409, 'IDEMPOTENCY_IN_PROGRESS'))
      .mockResolvedValueOnce(successEnvelope({ id: 5 }, 201));

    const pending = apiClient.post<{ id: number }>(
      '/api/v1/printing/orders/',
      { a: 1 },
      { idempotencyKey: 'same-key' },
    );

    await jest.advanceTimersByTimeAsync(IDEMPOTENCY_IN_PROGRESS_DELAYS_MS[0]);

    await expect(pending).resolves.toEqual({ id: 5 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(headersOf(fetchMock, 0)['Idempotency-Key']).toBe('same-key');
    expect(headersOf(fetchMock, 1)['Idempotency-Key']).toBe('same-key');
  });

  it('gives up with IDEMPOTENCY_IN_PROGRESS after the bounded waits', async () => {
    fetchMock.mockResolvedValue(errorEnvelope(409, 'IDEMPOTENCY_IN_PROGRESS'));

    const pending = apiClient.post('/api/v1/printing/orders/', {}, { idempotencyKey: 'k' });
    const assertion = expect(pending).rejects.toMatchObject({ code: 'IDEMPOTENCY_IN_PROGRESS' });

    await jest.advanceTimersByTimeAsync(
      IDEMPOTENCY_IN_PROGRESS_DELAYS_MS.reduce((a, b) => a + b, 0),
    );
    await assertion;
    expect(fetchMock).toHaveBeenCalledTimes(IDEMPOTENCY_IN_PROGRESS_DELAYS_MS.length + 1);
  });

  it('does not wait for IN_PROGRESS when no key was sent', async () => {
    fetchMock.mockResolvedValue(errorEnvelope(409, 'IDEMPOTENCY_IN_PROGRESS'));

    await expect(apiClient.post('/api/v1/x/', {})).rejects.toMatchObject({
      code: 'IDEMPOTENCY_IN_PROGRESS',
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe('token refresh', () => {
  function unauthorized() {
    return errorEnvelope(401, 'AUTHENTICATION_FAILED');
  }

  it('retries once with the new token after a successful refresh', async () => {
    registerApiAuthBridge({
      getAccessToken: () => 'old',
      refreshAccessToken: async () => 'new',
      onSessionExpired: jest.fn(),
    });
    fetchMock
      .mockResolvedValueOnce(unauthorized())
      .mockResolvedValueOnce(successEnvelope({ ok: 1 }));

    await expect(apiClient.get('/api/v1/groups/my/', { authToken: 'old' })).resolves.toEqual({
      ok: 1,
    });
    expect(headersOf(fetchMock, 1).Authorization).toBe('Bearer new');
  });

  it('does NOT sign out when the refresh fails transiently', async () => {
    const onSessionExpired = jest.fn();
    registerApiAuthBridge({
      getAccessToken: () => 'old',
      refreshAccessToken: async () => {
        throw new ApiClientError({ code: 'NETWORK_ERROR', message: 'offline' });
      },
      onSessionExpired,
    });
    fetchMock.mockResolvedValueOnce(unauthorized());

    await expect(apiClient.get('/api/v1/groups/my/', { authToken: 'old' })).rejects.toMatchObject({
      code: 'NETWORK_ERROR',
    });
    expect(onSessionExpired).not.toHaveBeenCalled();
  });

  it('signs out only when the refresh is definitively rejected', async () => {
    const onSessionExpired = jest.fn();
    registerApiAuthBridge({
      getAccessToken: () => 'old',
      refreshAccessToken: async () => null,
      onSessionExpired,
    });
    fetchMock.mockResolvedValueOnce(unauthorized());

    await expect(apiClient.get('/api/v1/groups/my/', { authToken: 'old' })).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    });
    expect(onSessionExpired).toHaveBeenCalledTimes(1);
  });

  it('shares one refresh between concurrent 401s', async () => {
    const refresh = jest.fn(async () => 'new');
    registerApiAuthBridge({
      getAccessToken: () => 'old',
      refreshAccessToken: refresh,
      onSessionExpired: jest.fn(),
    });
    fetchMock.mockImplementation(async (_url, init) =>
      (init?.headers as Record<string, string>).Authorization === 'Bearer new'
        ? successEnvelope({ ok: 1 })
        : unauthorized(),
    );

    await Promise.all([
      apiClient.get('/api/v1/a/', { authToken: 'old' }),
      apiClient.get('/api/v1/b/', { authToken: 'old' }),
    ]);

    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('treats a plain network failure of the original request as a network error', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Network request failed'));

    await expect(apiClient.get('/api/v1/groups/my/')).rejects.toMatchObject({
      code: 'NETWORK_ERROR',
    });
  });
});
