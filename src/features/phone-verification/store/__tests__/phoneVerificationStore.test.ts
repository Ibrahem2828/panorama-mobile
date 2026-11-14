jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { extra: { apiBaseUrl: 'https://api.example.com' } } },
}));
jest.mock('../../../../api/services/phoneVerification.service', () => ({
  createPhoneVerification: jest.fn(),
  getCurrentPhoneVerification: jest.fn(),
  confirmPhoneVerification: jest.fn(),
  cancelPhoneVerification: jest.fn(),
}));
const mockRefreshAllGroups = jest.fn(async () => undefined);
const mockLoadProfile = jest.fn(async () => undefined);
jest.mock('../../../groups/store', () => ({
  useGroupsStore: { getState: () => ({ refreshAllGroups: mockRefreshAllGroups }) },
}));
jest.mock('../../../profile/store', () => ({
  useProfileStore: { getState: () => ({ loadProfile: mockLoadProfile }) },
}));

import { createApiError } from '../../../../api/errors';
import * as service from '../../../../api/services/phoneVerification.service';
import type { PhoneVerificationRequest } from '../../../../api';
import { useAuthStore } from '../../../auth/store';
import { usePhoneVerificationStore } from '../phoneVerificationStore';

const create = service.createPhoneVerification as jest.Mock;
const current = service.getCurrentPhoneVerification as jest.Mock;
const confirm = service.confirmPhoneVerification as jest.Mock;
const cancel = service.cancelPhoneVerification as jest.Mock;
const state = () => usePhoneVerificationStore.getState();

function req(overrides: Partial<PhoneVerificationRequest> = {}): PhoneVerificationRequest {
  return {
    id: 1,
    phone_number: '+963912345678',
    status: 'pending_staff',
    created_at: '2026-11-13T10:00:00Z',
    code_sent_at: null,
    expires_at: null,
    attempts_remaining: 5,
    rejection_reason: '',
    verified_at: null,
    ...overrides,
  };
}

function refusal(status: number, errorCode: string, details?: Record<string, unknown>) {
  return createApiError({ status, errorCode, details, message: 'x' });
}

beforeEach(() => {
  jest.clearAllMocks();
  state().reset();
  useAuthStore.setState({
    accessToken: 'token',
    status: 'authenticated',
    user: { id: 1, role: 'student', is_phone_verified: false },
  });
});

describe('loading the status', () => {
  it('stores the current request (null when the student never asked)', async () => {
    current.mockResolvedValue({ request: null });

    await state().load();

    expect(state()).toMatchObject({ request: null, hasLoaded: true, isLoading: false });
  });

  it('keeps the screen working when a silent refresh fails', async () => {
    current.mockResolvedValueOnce({ request: req() });
    await state().load();

    current.mockRejectedValueOnce(refusal(500, 'SERVER_ERROR'));
    await state().load({ silent: true });

    expect(state().request?.status).toBe('pending_staff');
    expect(state().failure).toBeNull();
  });

  it('shows a load failure when nothing was ever loaded', async () => {
    current.mockRejectedValue(refusal(500, 'SERVER_ERROR'));

    await state().load();

    expect(state()).toMatchObject({ hasLoaded: false, failure: { kind: 'generic' } });
  });
});

describe('the whole flow', () => {
  it('request -> waiting -> code sent -> verified, then refreshes the account and groups', async () => {
    create.mockResolvedValue(req());
    await expect(state().submit('+963912345678', 'pw')).resolves.toBe(true);
    expect(create).toHaveBeenCalledWith({ phone_number: '+963912345678', password: 'pw' }, 'token');
    expect(state().request?.status).toBe('pending_staff');

    current.mockResolvedValue({
      request: req({ status: 'code_sent', expires_at: '2026-11-13T10:10:00Z' }),
    });
    await state().load({ silent: true });
    expect(state().request?.status).toBe('code_sent');

    confirm.mockResolvedValue(req({ status: 'verified', verified_at: '2026-11-13T10:05:00Z' }));
    await expect(state().confirm('123456')).resolves.toBe(true);

    expect(state().request?.status).toBe('verified');
    expect(useAuthStore.getState().user).toMatchObject({
      is_phone_verified: true,
      phone_number: '+963912345678',
    });
    expect(mockLoadProfile).toHaveBeenCalled();
    expect(mockRefreshAllGroups).toHaveBeenCalled();
  });

  it('a push-driven refresh that finds the request verified also refreshes the account and groups', async () => {
    current.mockResolvedValueOnce({ request: req({ status: 'code_sent' }) });
    await state().load();

    current.mockResolvedValueOnce({ request: req({ status: 'verified' }) });
    await state().load({ silent: true });

    expect(useAuthStore.getState().user?.is_phone_verified).toBe(true);
    expect(mockRefreshAllGroups).toHaveBeenCalledTimes(1);
  });
});

describe('errors', () => {
  it('a wrong password is reported and nothing is stored', async () => {
    create.mockRejectedValue(refusal(400, 'PASSWORD_INCORRECT'));

    await expect(state().submit('+963912345678', 'bad')).resolves.toBe(false);

    expect(state()).toMatchObject({ request: null, failure: { kind: 'password_incorrect' } });
  });

  it('an already-open request makes the app read the server copy', async () => {
    create.mockRejectedValue(refusal(409, 'PHONE_VERIFICATION_ALREADY_OPEN'));
    current.mockResolvedValue({ request: req() });

    await state().submit('+963912345678', 'pw');
    await Promise.resolve();
    await Promise.resolve();

    expect(current).toHaveBeenCalled();
  });

  it('a wrong code lowers the attempts left right away and keeps the code view', async () => {
    current.mockResolvedValue({
      request: req({ status: 'code_sent', expires_at: '2026-11-13T10:10:00Z' }),
    });
    await state().load();
    confirm.mockRejectedValue(refusal(400, 'PHONE_CODE_INVALID', { attempts_remaining: 4 }));

    await expect(state().confirm('000000')).resolves.toBe(false);

    expect(state().request).toMatchObject({ status: 'code_sent', attempts_remaining: 4 });
    expect(state().failure).toEqual({ kind: 'code_invalid', attemptsRemaining: 4 });
  });

  it('too many wrong codes: the request is re-read and ends up expired', async () => {
    current.mockResolvedValueOnce({ request: req({ status: 'code_sent' }) });
    await state().load();
    confirm.mockRejectedValue(refusal(400, 'PHONE_CODE_ATTEMPTS_EXCEEDED'));
    current.mockResolvedValue({ request: req({ status: 'expired' }) });

    await state().confirm('000000');
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(state().failure).toEqual({ kind: 'attempts_exceeded' });
    expect(state().request?.status).toBe('expired');
  });

  it('cancelling stores the closed request so the form comes back', async () => {
    create.mockResolvedValue(req());
    await state().submit('+963912345678', 'pw');
    cancel.mockResolvedValue(req({ status: 'cancelled' }));

    await state().cancel();

    expect(state().request?.status).toBe('cancelled');
  });

  it('cancelling a request that was already closed (404) reads the server copy', async () => {
    create.mockResolvedValue(req());
    await state().submit('+963912345678', 'pw');
    cancel.mockRejectedValue(refusal(404, 'PHONE_VERIFICATION_NOT_FOUND'));
    current.mockResolvedValue({ request: req({ status: 'rejected' }) });

    await state().cancel();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(state().request?.status).toBe('rejected');
  });

  it('ignores an older status read that finishes after a newer write', async () => {
    let finish: (value: unknown) => void = () => undefined;
    current.mockReturnValue(new Promise((resolve) => (finish = resolve)));
    const pending = state().load();

    create.mockResolvedValue(req({ id: 2 }));
    await state().submit('+963912345678', 'pw');
    finish({ request: null });
    await pending;

    expect(state().request?.id).toBe(2);
  });

  it('forgets the request when the session ends', async () => {
    create.mockResolvedValue(req());
    await state().submit('+963912345678', 'pw');

    useAuthStore.setState({ status: 'unauthenticated', accessToken: null });

    expect(state().request).toBeNull();
    expect(state().hasLoaded).toBe(false);
  });
});
