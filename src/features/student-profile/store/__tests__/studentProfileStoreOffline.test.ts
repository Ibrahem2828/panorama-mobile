jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { extra: { apiBaseUrl: 'https://api.example.com' } } },
}));
jest.mock('../../services', () => ({
  ...jest.requireActual('../../services'),
  getMyStudentProfile: jest.fn(),
  getAcademicSetupOptions: jest.fn(),
  listFacultiesForUniversity: jest.fn(),
  listMajorsForFaculty: jest.fn(),
  countSubjectsForFaculty: jest.fn(),
}));

import { createApiError } from '../../../../api/errors';
import { useAuthStore } from '../../../auth/store';
import * as services from '../../services';
import { useStudentProfileStore } from '../studentProfileStore';

const getMyStudentProfile = services.getMyStudentProfile as jest.Mock;
const getAcademicSetupOptions = services.getAcademicSetupOptions as jest.Mock;
const listFaculties = services.listFacultiesForUniversity as jest.Mock;
const listMajors = services.listMajorsForFaculty as jest.Mock;
const countSubjects = services.countSubjectsForFaculty as jest.Mock;
const state = () => useStudentProfileStore.getState();

const profile = {
  id: 1,
  university: { id: 1, name: 'U' },
  faculty: { id: 2, name: 'F' },
  academic_year: { id: 3, name: 'Y' },
  semester: { id: 4, name: 'S' },
  student_number: '123',
};
const offline = () => createApiError({ code: 'NETWORK_ERROR', message: 'offline' });

beforeEach(() => {
  jest.clearAllMocks();
  useAuthStore.setState({ status: 'authenticated', accessToken: 'a', user: { id: 7 } as never });
  useStudentProfileStore.getState().reset();
  getAcademicSetupOptions.mockResolvedValue({
    universities: [{ id: 1, name: 'U' }],
    academicYears: [],
    semesters: [],
  });
  listFaculties.mockResolvedValue([{ id: 2, name: 'F' }]);
  listMajors.mockResolvedValue([]);
  countSubjects.mockResolvedValue(5);
});

describe('student profile bootstrap without a connection', () => {
  it('opens with the saved profile even when the pickers lists are not saved', async () => {
    getMyStudentProfile.mockResolvedValue(profile);
    getAcademicSetupOptions.mockRejectedValue(offline());
    listFaculties.mockRejectedValue(offline());
    listMajors.mockRejectedValue(offline());
    countSubjects.mockRejectedValue(offline());

    await state().bootstrap();

    expect(state().loadFailed).toBe(false);
    expect(state().hasBootstrapped).toBe(true);
    expect(state().isBootstrapping).toBe(false);
    expect(state().profile).not.toBeNull();
    expect(state().universities).toEqual([]);
  });

  it('is blocked (with a retry, not a spinner) only when there is no profile to show', async () => {
    getMyStudentProfile.mockRejectedValue(offline());

    await state().bootstrap();

    expect(state().loadFailed).toBe(true);
    expect(state().isBootstrapping).toBe(false);
    expect(state().profile).toBeNull();
  });

  it('needs the setup lists when there is no profile yet', async () => {
    getMyStudentProfile.mockResolvedValue(null);
    getAcademicSetupOptions.mockRejectedValue(offline());

    await state().bootstrap();

    expect(state().loadFailed).toBe(true);
  });

  it('a failed forced refresh keeps the last good profile', async () => {
    getMyStudentProfile.mockResolvedValue(profile);
    await state().bootstrap();
    getMyStudentProfile.mockRejectedValue(offline());

    await state().bootstrap({ force: true });

    expect(state().profile).not.toBeNull();
    expect(state().loadFailed).toBe(false);
    expect(state().selectedFacultyId).toBe(2);
  });

  it('retry after being blocked loads the profile once the connection is back', async () => {
    getMyStudentProfile.mockRejectedValue(offline());
    await state().bootstrap();
    expect(state().loadFailed).toBe(true);

    getMyStudentProfile.mockResolvedValue(profile);
    await state().bootstrap({ force: true });

    expect(state().loadFailed).toBe(false);
    expect(state().profile).not.toBeNull();
  });
});

describe('silent revalidation after reconnecting', () => {
  it('never shows a loading state and replaces the data with the fresh answer', async () => {
    getMyStudentProfile.mockResolvedValue(profile);
    await state().bootstrap();
    const seen: boolean[] = [];
    const unsubscribe = useStudentProfileStore.subscribe((next) => seen.push(next.isBootstrapping));
    getMyStudentProfile.mockResolvedValue({ ...profile, student_number: '999' });

    await state().bootstrap({ force: true, silent: true });
    unsubscribe();

    expect(seen.every((value) => value === false)).toBe(true);
    expect(state().studentNumber).toBe('999');
  });

  it('keeps everything when the silent refresh fails', async () => {
    getMyStudentProfile.mockResolvedValue(profile);
    await state().bootstrap();
    getMyStudentProfile.mockRejectedValue(offline());

    await state().bootstrap({ force: true, silent: true });

    expect(state().profile).not.toBeNull();
    expect(state().loadFailed).toBe(false);
    expect(state().errorMessage).toBeNull();
  });
});

describe('profile snapshot wipe', () => {
  it('reset (sign-out, account switch, device replaced) clears the profile', async () => {
    getMyStudentProfile.mockResolvedValue(profile);
    await state().bootstrap();

    state().reset();

    expect(state().profile).toBeNull();
    expect(state().hasBootstrapped).toBe(false);
  });
});
