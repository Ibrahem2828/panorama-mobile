jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { extra: { apiBaseUrl: 'https://api.example.com' } } },
}));
jest.mock('../services/settingsService', () => ({
  ...jest.requireActual('../services/settingsService'),
  changeCurrentPassword: jest.fn(),
}));

import { ApiClientError } from '../../../api/errors';
import { useToastStore } from '../../../components/feedback/toastStore';
import { ar } from '../../../i18n/locales/ar';
import { useAuthStore } from '../../auth/store';
import { changeCurrentPassword, validateChangePasswordInput } from '../services/settingsService';
import { useSettingsStore } from '../store';

const change = changeCurrentPassword as jest.Mock;
const copy = ar.settings.changePassword;

function fill(old_password: string, new_password: string, confirm = new_password) {
  const store = useSettingsStore.getState();

  store.setOldPassword(old_password);
  store.setNewPassword(new_password);
  store.setNewPasswordConfirm(confirm);
}

const logout = jest.fn(async () => {
  useAuthStore.setState({ status: 'unauthenticated', accessToken: null, refreshToken: null });
});

beforeEach(() => {
  jest.clearAllMocks();
  useSettingsStore.getState().reset();
  useToastStore.getState().hide();
  useAuthStore.setState({
    status: 'authenticated',
    accessToken: 'access',
    refreshToken: 'refresh',
    logout,
  });
});

describe('validateChangePasswordInput', () => {
  const check = (old_password: string, new_password: string, confirm: string) =>
    validateChangePasswordInput(
      { old_password, new_password, new_password_confirm: confirm },
      ar.settings,
    );

  it('explains every rule in Arabic', () => {
    expect(check('', '', '')).toEqual({
      old_password: copy.currentRequired,
      new_password: copy.newRequired,
      new_password_confirm: copy.confirmRequired,
    });
    expect(check('old-pass', 'short', 'short').new_password).toBe(copy.tooShort);
    expect(check('old-pass', '12345678', '12345678').new_password).toBe(copy.numericOnly);
    expect(check('same-password', 'same-password', 'same-password').new_password).toBe(
      copy.sameAsCurrent,
    );
    expect(check('old-pass', 'new-pass-1', 'other-pass').new_password_confirm).toBe(copy.mismatch);
    expect(check('old-pass', 'new-pass-1', 'new-pass-1')).toEqual({});
  });
});

describe('changePassword', () => {
  it('does not call the server while the form is invalid', async () => {
    fill('old-pass', 'short');

    await expect(useSettingsStore.getState().changePassword()).resolves.toBe(false);

    expect(change).not.toHaveBeenCalled();
    expect(useSettingsStore.getState().passwordValidation.new_password).toBe(copy.tooShort);
    expect(logout).not.toHaveBeenCalled();
  });

  it('tells the user and signs out cleanly after the server ends every session', async () => {
    change.mockResolvedValue({});
    fill('old-pass', 'new-pass-1');

    await expect(useSettingsStore.getState().changePassword()).resolves.toBe(true);

    expect(change).toHaveBeenCalledWith(
      { old_password: 'old-pass', new_password: 'new-pass-1', new_password_confirm: 'new-pass-1' },
      'access',
    );
    expect(useToastStore.getState().message).toBe(copy.successSignedOut);
    expect(logout).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState().status).toBe('unauthenticated');
    // The typed passwords are wiped.
    expect(useSettingsStore.getState().passwordDraft).toEqual({
      old_password: '',
      new_password: '',
      new_password_confirm: '',
    });
    expect(useSettingsStore.getState().isChangingPassword).toBe(false);
  });

  it('stays signed in and shows the error when the change fails', async () => {
    change.mockRejectedValue(
      new ApiClientError({ code: 'NETWORK_ERROR', status: undefined, message: 'x' }),
    );
    fill('old-pass', 'new-pass-1');

    await expect(useSettingsStore.getState().changePassword()).resolves.toBe(false);

    expect(logout).not.toHaveBeenCalled();
    expect(useToastStore.getState().message).toBeNull();
    expect(useSettingsStore.getState().errorMessage).toBe(ar.settings.errors.network);
    expect(useSettingsStore.getState().isChangingPassword).toBe(false);
    expect(useSettingsStore.getState().passwordDraft.new_password).toBe('new-pass-1');
  });
});
