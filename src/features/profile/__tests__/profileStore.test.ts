jest.mock('expo-web-browser', () => ({ openBrowserAsync: jest.fn() }));
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { extra: { apiBaseUrl: 'https://api.example.com' } } },
}));
jest.mock('../services/profileService', () => ({
  ...jest.requireActual('../services/profileService'),
  updateCurrentProfile: jest.fn(),
  loadCurrentProfile: jest.fn(),
}));

import { useToastStore } from '../../../components/feedback/toastStore';
import { ar } from '../../../i18n/locales/ar';
import { useAuthStore } from '../../auth/store';
import { updateCurrentProfile } from '../services/profileService';
import { useProfileStore } from '../store';

const update = updateCurrentProfile as jest.Mock;

function startAs(role: string) {
  const user = { id: 1, full_name: 'أحمد علي', username: 'ahmad', job_title: 'مشرف', role };

  useAuthStore.setState({ accessToken: 'token', user });
  useProfileStore.setState({
    user,
    editDraft: { full_name: 'أحمد علي', username: 'ahmad', job_title: 'مشرف' },
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  useProfileStore.getState().reset();
  useToastStore.getState().hide();
});

describe('updateProfile', () => {
  it('sends the job title for staff and shows a success toast', async () => {
    startAs('print_staff');
    update.mockImplementation(async (input) => ({
      id: 1,
      role: 'print_staff',
      full_name: input.full_name,
      username: input.username,
      job_title: input.job_title,
    }));
    useProfileStore.getState().setJobTitle('  مدير المطبعة ');

    const user = await useProfileStore.getState().updateProfile();

    expect(update).toHaveBeenCalledWith(
      { full_name: 'أحمد علي', username: 'ahmad', job_title: 'مدير المطبعة' },
      'token',
    );
    expect(user?.job_title).toBe('مدير المطبعة');
    expect(useToastStore.getState().message).toBe(ar.profile.edit.updateSuccess);
    expect(useAuthStore.getState().user?.job_title).toBe('مدير المطبعة');
  });

  it('never sends a job title for a student', async () => {
    startAs('student');
    update.mockResolvedValue({ id: 1, role: 'student', full_name: 'علي', username: 'ahmad' });
    useProfileStore.getState().setFullName('علي');
    useProfileStore.getState().setJobTitle('مدير');

    await useProfileStore.getState().updateProfile();

    expect(update).toHaveBeenCalledWith({ full_name: 'علي', username: 'ahmad' }, 'token');
  });

  it('refuses an invalid draft with the first Arabic message and does not call the server', async () => {
    startAs('student');
    useProfileStore.getState().setFullName(' ');

    await expect(useProfileStore.getState().updateProfile()).resolves.toBeNull();

    expect(update).not.toHaveBeenCalled();
    expect(useProfileStore.getState().errorMessage).toBe(ar.profile.edit.fullNameRequired);
  });
});
