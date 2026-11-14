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
  login: jest.fn(),
  getCurrentUser: jest.fn(),
  refreshToken: jest.fn(),
  switchDevice: jest.fn(),
  logout: jest.fn(),
}));

import { ApiClientError, createApiError } from '../../../../api/errors';
import * as authService from '../../../../api/services/auth.service';
import {
  createInMemoryCacheStorage,
  setCacheStorageAdapter,
} from '../../../../offline/cacheStorage';
import {
  bootstrapSession,
  loginWithCredentials,
  refreshAccessToken,
  switchDeviceSession,
} from '../authSessionService';
import { clearAuthTokens, getStoredAuthTokens, saveAuthTokens } from '../authTokenStorage';
import {
  classifyDeviceSwitchError,
  DeviceMismatchLoginError,
  DeviceSwitchError,
  deviceLockReducer,
  initialDeviceLockState,
  type DeviceLockState,
} from '../deviceLock';

const mismatchInfo = {
  boundDevice: { name: 'Pixel 7', platform: 'android', lastSeenAt: '2026-11-10T10:00:00Z' },
  canSwitch: true,
  switchesRemaining: 1,
  switchToken: 'tok',
  switchTokenExpiresInSeconds: 600,
};

function backendError(status: number, errorCode: string, details?: Record<string, unknown>) {
  return createApiError({ status, errorCode, details, message: 'x' });
}

const login = authService.login as jest.Mock;
const getCurrentUser = authService.getCurrentUser as jest.Mock;
const refreshToken = authService.refreshToken as jest.Mock;
const switchDevice = authService.switchDevice as jest.Mock;
const storedTokens = getStoredAuthTokens as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  setCacheStorageAdapter(createInMemoryCacheStorage());
  storedTokens.mockResolvedValue({ accessToken: 'a', refreshToken: 'r' });
});

afterAll(() => setCacheStorageAdapter(null));

describe('device lock state machine', () => {
  const at = 1_000_000;
  const conflict = (): DeviceLockState =>
    deviceLockReducer(initialDeviceLockState, { type: 'mismatch', info: mismatchInfo, now: at });

  it('offers the switch when the server allows it, and remembers when the token runs out', () => {
    expect(conflict()).toMatchObject({ phase: 'conflict', expiresAt: at + 600_000, error: null });
  });

  it('goes straight to the contact-the-administration state when no switch is left', () => {
    const state = deviceLockReducer(initialDeviceLockState, {
      type: 'mismatch',
      info: { ...mismatchInfo, canSwitch: false, switchToken: null, switchesRemaining: 0 },
      now: at,
    });

    expect(state.phase).toBe('limit');
  });

  it('moves conflict -> switching, and ignores a second tap while switching', () => {
    const switching = deviceLockReducer(conflict(), { type: 'switch_started' });

    expect(switching.phase).toBe('switching');
    expect(deviceLockReducer(switching, { type: 'switch_started' })).toBe(switching);
    expect(deviceLockReducer(initialDeviceLockState, { type: 'switch_started' })).toBe(
      initialDeviceLockState,
    );
  });

  it.each([
    ['token_invalid', 'expired', null],
    ['limit_reached', 'limit', null],
    ['network', 'conflict', 'network'],
    ['generic', 'conflict', 'generic'],
    ['id_required', 'conflict', 'id_required'],
  ] as const)('failure %s -> phase %s', (failure, phase, error) => {
    const switching = deviceLockReducer(conflict(), { type: 'switch_started' });

    expect(deviceLockReducer(switching, { type: 'switch_failed', failure })).toMatchObject({
      phase,
      error,
    });
  });

  it('a retry after a network failure is possible', () => {
    const failed = deviceLockReducer(deviceLockReducer(conflict(), { type: 'switch_started' }), {
      type: 'switch_failed',
      failure: 'network',
    });

    expect(deviceLockReducer(failed, { type: 'switch_started' }).phase).toBe('switching');
  });

  it('expires the offer when the switch token lifetime passes', () => {
    expect(deviceLockReducer(conflict(), { type: 'tick', now: at + 599_000 }).phase).toBe(
      'conflict',
    );
    expect(deviceLockReducer(conflict(), { type: 'tick', now: at + 600_000 }).phase).toBe(
      'expired',
    );
  });

  it('reset returns to the login form', () => {
    expect(deviceLockReducer(conflict(), { type: 'reset' })).toEqual(initialDeviceLockState);
  });
});

describe('classifying a failed switch', () => {
  it.each([
    [backendError(400, 'DEVICE_SWITCH_TOKEN_INVALID'), 'token_invalid'],
    [backendError(403, 'DEVICE_SWITCH_LIMIT_REACHED', { contact_admin: true }), 'limit_reached'],
    [backendError(400, 'DEVICE_ID_REQUIRED'), 'id_required'],
    [new ApiClientError({ code: 'NETWORK_ERROR', message: 'x' }), 'network'],
    [new ApiClientError({ code: 'SERVER_ERROR', status: 500, message: 'x' }), 'generic'],
  ] as const)('%#', (error, expected) => {
    expect(classifyDeviceSwitchError(error)).toBe(expected);
  });
});

describe('session service with device binding', () => {
  it('turns a 409 DEVICE_MISMATCH login into the structured refusal and stores no tokens', async () => {
    login.mockRejectedValue(
      backendError(409, 'DEVICE_MISMATCH', {
        bound_device: {
          name: 'Pixel 7',
          platform: 'android',
          last_seen_at: '2026-11-10T10:00:00Z',
        },
        can_switch: true,
        switches_remaining: 1,
        device_switch_token: 'tok',
        device_switch_token_expires_in: 600,
      }),
    );

    const error = await loginWithCredentials({ identifier: 'a', password: 'b' }).catch(
      (caught: unknown) => caught,
    );

    expect(error).toBeInstanceOf(DeviceMismatchLoginError);
    expect((error as DeviceMismatchLoginError).info).toEqual(mismatchInfo);
    expect(saveAuthTokens).not.toHaveBeenCalled();
  });

  it('still reports a wrong password as an ordinary login error', async () => {
    login.mockRejectedValue(
      new ApiClientError({
        code: 'VALIDATION_ERROR',
        status: 400,
        message: 'x',
        fieldErrors: { password: ['bad'] },
      }),
    );

    await expect(
      loginWithCredentials({ identifier: 'a', password: 'b' }),
    ).rejects.not.toBeInstanceOf(DeviceMismatchLoginError);
  });

  it('switching stores the new tokens and loads the user', async () => {
    switchDevice.mockResolvedValue({ access: 'a2', refresh: 'r2' });
    getCurrentUser.mockResolvedValue({ id: 5, role: 'student' });

    const session = await switchDeviceSession('tok');

    expect(switchDevice).toHaveBeenCalledWith('tok');
    expect(saveAuthTokens).toHaveBeenCalledWith({ accessToken: 'a2', refreshToken: 'r2' });
    expect(session.user.id).toBe(5);
  });

  it('a refused switch raises a classified error and stores nothing', async () => {
    switchDevice.mockRejectedValue(backendError(403, 'DEVICE_SWITCH_LIMIT_REACHED'));

    await expect(switchDeviceSession('tok')).rejects.toMatchObject({
      constructor: DeviceSwitchError,
      failure: 'limit_reached',
    });
    expect(saveAuthTokens).not.toHaveBeenCalled();
  });

  it('refresh answered DEVICE_MISMATCH: tokens are cleared and the error is surfaced', async () => {
    refreshToken.mockRejectedValue(backendError(409, 'DEVICE_MISMATCH'));

    await expect(refreshAccessToken()).rejects.toMatchObject({ errorCode: 'DEVICE_MISMATCH' });
    expect(clearAuthTokens).toHaveBeenCalled();
  });

  it('cold start with a replaced device returns to login with the device explanation', async () => {
    getCurrentUser.mockRejectedValue(backendError(401, 'DEVICE_MISMATCH'));

    const result = await bootstrapSession();

    expect(result).toEqual({ session: null, sessionExpired: false, endReason: 'device_replaced' });
    expect(clearAuthTokens).toHaveBeenCalled();
  });

  it('cold start after staff ended the session reports its own reason', async () => {
    getCurrentUser.mockRejectedValue(backendError(401, 'SESSION_REVOKED_BY_ADMIN'));

    await expect(bootstrapSession()).resolves.toEqual({
      session: null,
      sessionExpired: false,
      endReason: 'revoked_by_admin',
    });
    expect(clearAuthTokens).toHaveBeenCalled();
  });

  it('refresh answered SESSION_REVOKED_BY_ADMIN: tokens cleared and the error surfaced', async () => {
    refreshToken.mockRejectedValue(backendError(401, 'SESSION_REVOKED_BY_ADMIN'));

    await expect(refreshAccessToken()).rejects.toMatchObject({
      errorCode: 'SESSION_REVOKED_BY_ADMIN',
    });
    expect(clearAuthTokens).toHaveBeenCalled();
  });

  it('cold start: a plain expired session still refreshes as before', async () => {
    getCurrentUser
      .mockRejectedValueOnce(
        new ApiClientError({ code: 'UNAUTHORIZED', status: 401, message: 'x' }),
      )
      .mockResolvedValueOnce({ id: 9, role: 'student' });
    refreshToken.mockResolvedValue({ access: 'a2' });

    const result = await bootstrapSession();

    expect(result.session?.user.id).toBe(9);
    expect(result.endReason).toBeUndefined();
  });
});
