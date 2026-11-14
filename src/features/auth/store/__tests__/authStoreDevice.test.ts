jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { extra: { apiBaseUrl: 'https://api.example.com' } } },
}));
jest.mock('../../services/authSessionService', () => ({
  ...jest.requireActual('../../services/authSessionService'),
  bootstrapSession: jest.fn(),
  loginWithCredentials: jest.fn(),
  switchDeviceSession: jest.fn(),
  refreshAccessToken: jest.fn(),
  logoutSession: jest.fn(),
  endSessionReplacedByAnotherDevice: jest.fn(async () => undefined),
}));

import { createApiError } from '../../../../api/errors';
import { useLocaleStore } from '../../../../i18n';
import * as session from '../../services/authSessionService';
import { DeviceMismatchLoginError, DeviceSwitchError } from '../../services/deviceLock';
import { useAuthStore } from '../authStore';

const loginWithCredentials = session.loginWithCredentials as jest.Mock;
const switchDeviceSession = session.switchDeviceSession as jest.Mock;
const bootstrapSession = session.bootstrapSession as jest.Mock;
const refreshSessionAccessToken = session.refreshAccessToken as jest.Mock;
const state = () => useAuthStore.getState();
const replaced = () => useLocaleStore.getState().t.deviceLock.replacedNotice;
const expired = () => useLocaleStore.getState().t.auth.errors.sessionExpired;

const info = {
  boundDevice: { name: 'Pixel 7', platform: 'android', lastSeenAt: null },
  canSwitch: true,
  switchesRemaining: 1,
  switchToken: 'tok',
  switchTokenExpiresInSeconds: 600,
};
const session1 = {
  user: { id: 3, role: 'student' },
  tokens: { accessToken: 'a', refreshToken: 'r' },
};

beforeEach(() => {
  jest.clearAllMocks();
  useAuthStore.setState({
    status: 'unauthenticated',
    user: null,
    accessToken: null,
    refreshToken: null,
    errorMessage: null,
    isBootstrapping: false,
    isSubmitting: false,
  });
  state().resetDeviceLock();
  useAuthStore.setState({ endedByDevice: false });
});

describe('login from another device', () => {
  it('opens the device lock instead of showing a login error', async () => {
    loginWithCredentials.mockRejectedValue(new DeviceMismatchLoginError(info));

    await expect(state().login({ identifier: 'a', password: 'b' })).rejects.toBeInstanceOf(
      DeviceMismatchLoginError,
    );

    expect(state().errorMessage).toBeNull();
    expect(state().status).toBe('unauthenticated');
    expect(state().deviceLock).toMatchObject({ phase: 'conflict', info });
  });

  it('switching signs the student in and clears the lock', async () => {
    loginWithCredentials.mockRejectedValue(new DeviceMismatchLoginError(info));
    await state()
      .login({ identifier: 'a', password: 'b' })
      .catch(() => undefined);
    switchDeviceSession.mockResolvedValue(session1);

    await state().switchDevice();

    expect(switchDeviceSession).toHaveBeenCalledWith('tok');
    expect(state()).toMatchObject({ status: 'authenticated', accessToken: 'a' });
    expect(state().deviceLock.phase).toBe('none');
  });

  it('an expired switch link moves to the expired state', async () => {
    loginWithCredentials.mockRejectedValue(new DeviceMismatchLoginError(info));
    await state()
      .login({ identifier: 'a', password: 'b' })
      .catch(() => undefined);
    switchDeviceSession.mockRejectedValue(new DeviceSwitchError('token_invalid'));

    await state().switchDevice();

    expect(state().deviceLock.phase).toBe('expired');
    expect(state().status).toBe('unauthenticated');
  });

  it('a used-up allowance moves to the contact-the-administration state', async () => {
    loginWithCredentials.mockRejectedValue(new DeviceMismatchLoginError(info));
    await state()
      .login({ identifier: 'a', password: 'b' })
      .catch(() => undefined);
    switchDeviceSession.mockRejectedValue(new DeviceSwitchError('limit_reached'));

    await state().switchDevice();

    expect(state().deviceLock.phase).toBe('limit');
  });

  it('does nothing without a pending conflict', async () => {
    await state().switchDevice();

    expect(switchDeviceSession).not.toHaveBeenCalled();
  });

  it('a normal login failure still shows the ordinary message and no lock', async () => {
    loginWithCredentials.mockRejectedValue(new Error('wrong'));

    await state()
      .login({ identifier: 'a', password: 'b' })
      .catch(() => undefined);

    expect(state().deviceLock.phase).toBe('none');
    expect(state().errorMessage).toBeTruthy();
  });
});

describe('this device was replaced', () => {
  it('a request-level mismatch signs out with the explanation', async () => {
    useAuthStore.setState({ status: 'authenticated', accessToken: 'a', refreshToken: 'r' });

    await state().forceDeviceReplaced();

    expect(state()).toMatchObject({
      status: 'unauthenticated',
      accessToken: null,
      errorMessage: replaced(),
    });
    expect(session.endSessionReplacedByAnotherDevice).toHaveBeenCalled();
  });

  it('a refresh mismatch signs out with the explanation, and a later "session expired" does not replace it', async () => {
    useAuthStore.setState({ status: 'authenticated', accessToken: 'a', refreshToken: 'r' });
    refreshSessionAccessToken.mockRejectedValue(
      createApiError({ status: 409, errorCode: 'DEVICE_MISMATCH', message: 'x' }),
    );

    await expect(state().refreshAccessToken()).resolves.toBeNull();
    await state().forceSessionExpired();

    expect(state().errorMessage).toBe(replaced());
    expect(state().errorMessage).not.toBe(expired());
  });

  it('cold start explains it on the login screen', async () => {
    useAuthStore.setState({ status: 'idle' });
    bootstrapSession.mockResolvedValue({
      session: null,
      sessionExpired: false,
      endReason: 'device_replaced',
    });

    await state().bootstrap();

    expect(state()).toMatchObject({ status: 'unauthenticated', errorMessage: replaced() });
  });

  it('staff ending the session shows its own message, on a request, a refresh and a cold start', async () => {
    const revoked = useLocaleStore.getState().t.deviceLock.revokedNotice;

    expect(revoked).not.toBe(replaced());

    useAuthStore.setState({ status: 'authenticated', accessToken: 'a', refreshToken: 'r' });
    await state().forceDeviceReplaced('revoked_by_admin');
    expect(state().errorMessage).toBe(revoked);

    useAuthStore.setState({ status: 'authenticated', accessToken: 'a', refreshToken: 'r' });
    refreshSessionAccessToken.mockRejectedValue(
      createApiError({ status: 401, errorCode: 'SESSION_REVOKED_BY_ADMIN', message: 'x' }),
    );
    await expect(state().refreshAccessToken()).resolves.toBeNull();
    await state().forceSessionExpired();
    expect(state().errorMessage).toBe(revoked);

    useAuthStore.setState({ status: 'idle', endedByDevice: false });
    bootstrapSession.mockResolvedValue({
      session: null,
      sessionExpired: false,
      endReason: 'revoked_by_admin',
    });
    await state().bootstrap();
    expect(state().errorMessage).toBe(revoked);
  });

  it('an ordinary expired session keeps its own message', async () => {
    useAuthStore.setState({ status: 'authenticated', accessToken: 'a', refreshToken: 'r' });

    await state().forceSessionExpired();

    expect(state().errorMessage).toBe(expired());
  });

  it('the next login clears the explanation', async () => {
    await state().forceDeviceReplaced();
    loginWithCredentials.mockResolvedValue(session1);

    await state().login({ identifier: 'a', password: 'b' });

    expect(state()).toMatchObject({ status: 'authenticated', errorMessage: null });
    expect(state().endedByDevice).toBe(false);
  });
});
