jest.mock('react-native', () => ({
  Platform: { OS: 'android' },
  I18nManager: { isRTL: true, forceRTL: jest.fn(), allowRTL: jest.fn() },
  AppState: { currentState: 'active', addEventListener: jest.fn(() => ({ remove: jest.fn() })) },
}));
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { extra: { apiBaseUrl: 'https://api.example.com' } } },
}));

import { installFetchMock, errorEnvelope, successEnvelope } from '../../../api/__tests__/testUtils';
import { apiClient } from '../../../api';
import {
  getMaintenancePollIntervalMs,
  MAX_MAINTENANCE_POLL_SECONDS,
  MIN_MAINTENANCE_POLL_SECONDS,
  useLifecycleStore,
} from '../store/lifecycleStore';
import { resolveStoreUrl } from '../utils/storeUrl';

const fetchMock = installFetchMock();

function bootstrap(maintenanceEnabled: boolean) {
  return successEnvelope({
    maintenance: { enabled: maintenanceEnabled, retry_after_seconds: 30 },
    update: { store_url: 'https://play.google.com/store/apps/details?id=x' },
  });
}

beforeEach(() => {
  fetchMock.mockReset();
  useLifecycleStore.getState().reset();
});

describe('maintenance gate', () => {
  it('enters maintenance when the client sees MAINTENANCE_MODE', async () => {
    fetchMock.mockResolvedValue(
      errorEnvelope(503, 'MAINTENANCE_MODE', { title_en: 'Down', estimated_end_at: null }),
    );

    await expect(apiClient.get('/api/v1/groups/my/')).rejects.toBeDefined();

    expect(useLifecycleStore.getState().maintenance).toMatchObject({ titleEn: 'Down' });
  });

  it('probes the public bootstrap endpoint, not /health/ (which is exempt from the gate)', async () => {
    useLifecycleStore.getState().handleLifecycleError({
      code: 'MAINTENANCE_MODE',
      message: 'm',
      status: 503,
    });
    fetchMock.mockResolvedValue(bootstrap(true));

    await useLifecycleStore.getState().recheck();

    expect(fetchMock.mock.calls[0][0]).toContain('/api/v1/mobile/bootstrap/');
    expect(fetchMock.mock.calls[0][0]).not.toContain('/health/');
  });

  it('stays in maintenance while the backend still reports it', async () => {
    useLifecycleStore.getState().handleLifecycleError({
      code: 'MAINTENANCE_MODE',
      message: 'm',
      status: 503,
    });
    fetchMock.mockResolvedValue(bootstrap(true));

    await expect(useLifecycleStore.getState().recheck()).resolves.toBe('still_down');
    expect(useLifecycleStore.getState().maintenance).not.toBeNull();
  });

  it('recovers automatically once the backend reports maintenance is over', async () => {
    useLifecycleStore.getState().handleLifecycleError({
      code: 'MAINTENANCE_MODE',
      message: 'm',
      status: 503,
    });
    fetchMock.mockResolvedValue(bootstrap(false));

    await expect(useLifecycleStore.getState().recheck()).resolves.toBe('recovered');
    expect(useLifecycleStore.getState().maintenance).toBeNull();
  });

  it('stays blocked and reports a failed probe when the network is down', async () => {
    useLifecycleStore.getState().handleLifecycleError({
      code: 'MAINTENANCE_MODE',
      message: 'm',
      status: 503,
    });
    fetchMock.mockRejectedValue(new TypeError('Network request failed'));

    await expect(useLifecycleStore.getState().recheck()).resolves.toBe('failed');
    expect(useLifecycleStore.getState().maintenance).not.toBeNull();
    expect(useLifecycleStore.getState().isChecking).toBe(false);
  });

  it('clamps the poll interval between the minimum and maximum', () => {
    const base = { titleAr: '', titleEn: '', messageAr: '', messageEn: '', estimatedEndAt: null };

    expect(getMaintenancePollIntervalMs({ ...base, retryAfterSeconds: 1 })).toBe(
      MIN_MAINTENANCE_POLL_SECONDS * 1000,
    );
    expect(getMaintenancePollIntervalMs({ ...base, retryAfterSeconds: 9999 })).toBe(
      MAX_MAINTENANCE_POLL_SECONDS * 1000,
    );
  });
});

describe('forced update gate', () => {
  it('captures the store url from the 426 payload and stays blocked', async () => {
    fetchMock.mockResolvedValue(
      errorEnvelope(426, 'APP_UPDATE_REQUIRED', { store_url: 'https://store.example/app' }),
    );

    await expect(apiClient.get('/api/v1/groups/my/')).rejects.toBeDefined();

    expect(useLifecycleStore.getState().updateRequired?.storeUrl).toBe('https://store.example/app');
  });

  it('only opens https/market store links, otherwise a platform fallback', () => {
    expect(
      resolveStoreUrl(
        { storeUrl: 'https://store.example/a', messageAr: '', messageEn: '' },
        'android',
      ),
    ).toBe('https://store.example/a');
    expect(
      resolveStoreUrl({ storeUrl: 'javascript:alert(1)', messageAr: '', messageEn: '' }, 'android'),
    ).toMatch(/^https:\/\/play\.google\.com\//u);
    expect(resolveStoreUrl(null, 'ios')).toMatch(/^https:\/\/apps\.apple\.com\//u);
  });
});
