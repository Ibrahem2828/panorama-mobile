jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { extra: { apiBaseUrl: 'https://api.example.com' } } },
}));
jest.mock('../termService', () => ({
  ...jest.requireActual('../termService'),
  loadCurrentTerm: jest.fn(),
  confirmTerm: jest.fn(),
}));

import { ApiClientError } from '../../../api/errors';
import { useAuthStore } from '../../auth/store';
import { buildConfirmationRequest, confirmTerm, loadCurrentTerm } from '../termService';
import { useTermStore } from '../termStore';

const load = loadCurrentTerm as jest.Mock;
const confirm = confirmTerm as jest.Mock;

const term = {
  semester: { id: 11, name: 'الثاني', order: 2 },
  other_semester: { id: 10, name: 'الأول', order: 1 },
  term_started_at: '2026-10-01T00:00:00Z',
  term_label: 'الفصل الأول 2026',
};

const networkError = () =>
  new ApiClientError({ code: 'NETWORK_ERROR', status: undefined, message: 'x' });

beforeEach(() => {
  jest.clearAllMocks();
  useTermStore.getState().reset();
  useAuthStore.setState({ accessToken: 'token' });
});

describe('buildConfirmationRequest', () => {
  it('sends no level for "no" and needs both pickers for "yes"', () => {
    expect(buildConfirmationRequest(false, 5, 6)).toEqual({
      promoted: false,
      academic_year: null,
      semester: null,
    });
    expect(buildConfirmationRequest(true, 2, 11)).toEqual({
      promoted: true,
      academic_year: 2,
      semester: 11,
    });
    expect(buildConfirmationRequest(true, null, 11)).toBeNull();
  });
});

describe('loadCurrentTerm', () => {
  it('stores the term and shares one request between concurrent callers', async () => {
    load.mockResolvedValue(term);

    const [first, second] = await Promise.all([
      useTermStore.getState().loadCurrentTerm(),
      useTermStore.getState().loadCurrentTerm(),
    ]);

    expect(first).toBe(term);
    expect(second).toBe(term);
    expect(load).toHaveBeenCalledTimes(1);
    expect(useTermStore.getState().currentTerm).toBe(term);
  });

  it('fails quietly and keeps the previous term', async () => {
    load.mockResolvedValueOnce(term).mockRejectedValueOnce(new Error('offline'));
    await useTermStore.getState().loadCurrentTerm();

    await expect(useTermStore.getState().loadCurrentTerm()).resolves.toBe(term);
    expect(useTermStore.getState().isLoading).toBe(false);
  });

  it('does nothing without a session', async () => {
    useAuthStore.setState({ accessToken: null });

    await expect(useTermStore.getState().loadCurrentTerm()).resolves.toBeNull();
    expect(load).not.toHaveBeenCalled();
  });
});

describe('submit', () => {
  it('marks the question answered after a successful POST', async () => {
    confirm.mockResolvedValue({});

    await expect(
      useTermStore.getState().submit({ promoted: true, academicYearId: 2, semesterId: 11 }),
    ).resolves.toBe(true);

    expect(confirm).toHaveBeenCalledWith(
      { promoted: true, academic_year: 2, semester: 11 },
      'token',
    );
    expect(useTermStore.getState()).toMatchObject({ answered: true, submitError: null });
  });

  it('keeps the question open on a network failure so the sheet can offer a retry', async () => {
    confirm.mockRejectedValue(networkError());

    await expect(
      useTermStore.getState().submit({ promoted: false, academicYearId: null, semesterId: null }),
    ).resolves.toBe(false);

    expect(useTermStore.getState()).toMatchObject({
      answered: false,
      isSubmitting: false,
      submitError: 'network',
    });

    confirm.mockResolvedValue({});
    await expect(
      useTermStore.getState().submit({ promoted: false, academicYearId: null, semesterId: null }),
    ).resolves.toBe(true);
    expect(useTermStore.getState().submitError).toBeNull();
  });

  it('reports other failures as generic and refuses "yes" without a chosen level', async () => {
    confirm.mockRejectedValue(
      new ApiClientError({ code: 'SERVER_ERROR', status: 500, message: 'x' }),
    );
    await useTermStore
      .getState()
      .submit({ promoted: false, academicYearId: null, semesterId: null });
    expect(useTermStore.getState().submitError).toBe('generic');

    confirm.mockClear();
    await expect(
      useTermStore.getState().submit({ promoted: true, academicYearId: null, semesterId: 11 }),
    ).resolves.toBe(false);
    expect(confirm).not.toHaveBeenCalled();
  });

  it('postpones without answering, and reset starts a new session', () => {
    useTermStore.getState().postpone();
    expect(useTermStore.getState()).toMatchObject({ postponed: true, answered: false });

    useTermStore.getState().reset();
    expect(useTermStore.getState().postponed).toBe(false);
  });
});
