const mockLoadFilesPage = jest.fn();
const mockSearchLocalFiles = jest.fn();

jest.mock('../../auth/store', () => ({
  useAuthStore: { getState: () => ({ accessToken: 'token' }) },
}));
jest.mock('../../../i18n', () => ({
  useLocaleStore: {
    getState: () => ({
      t: {
        files: {
          errors: { network: 'net', unauthorized: 'auth', permission: 'perm', generic: 'gen' },
        },
      },
    }),
  },
}));
jest.mock('../../../api', () => ({
  normalizeApiError: (error: { code?: string; status?: number }) => ({
    code: error?.code ?? 'UNKNOWN',
    status: error?.status,
  }),
}));
jest.mock('../../lectures/offline/offlineLibrary', () => ({
  useOfflineLibrary: { getState: () => ({ entries: {} }) },
}));
jest.mock('../../../api/errorKind', () => ({ classifyApiError: () => 'generic' }));
jest.mock('../services', () => ({
  loadFileDetail: jest.fn(),
  loadFiles: jest.fn(),
  loadGroupFiles: jest.fn(),
  loadFilesPage: (...args: unknown[]) => mockLoadFilesPage(...args),
  searchLocalFiles: (...args: unknown[]) => mockSearchLocalFiles(...args),
  toSafeFilesErrorMessage: () => 'safe error',
}));

import { useNetworkStore } from '../../../offline/networkStore';
import { useFilesStore } from '../store/filesStore';
import type { FileResource } from '../types';

function file(id: number): FileResource {
  return { id, title: `file ${id}` };
}

function page(ids: number[], next: string | null = null) {
  return { count: 40, next, previous: null, results: ids.map(file) };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });

  return { promise, resolve };
}

beforeEach(() => {
  mockLoadFilesPage.mockReset();
  mockSearchLocalFiles.mockReset();
  useNetworkStore.setState({ isOnline: true });
  useFilesStore.getState().reset();
});

describe('files list store', () => {
  it('loads the first page for a query and remembers the next page', async () => {
    mockLoadFilesPage.mockResolvedValue(page([1, 2], 'next'));

    await useFilesStore.getState().loadList({ subjectId: 9, search: 'نظري' });

    const state = useFilesStore.getState();

    expect(mockLoadFilesPage).toHaveBeenCalledWith('token', {
      subjectId: 9,
      search: 'نظري',
      page: 1,
    });
    expect(state.list.map((entry) => entry.id)).toEqual([1, 2]);
    expect(state.listNextPage).toBe(2);
    expect(state.hasLoadedList).toBe(true);
  });

  it('appends further pages without duplicating files', async () => {
    mockLoadFilesPage.mockResolvedValueOnce(page([1, 2], 'next'));
    await useFilesStore.getState().loadList({});
    mockLoadFilesPage.mockResolvedValueOnce(page([2, 3]));
    await useFilesStore.getState().loadMoreList();

    const state = useFilesStore.getState();

    expect(mockLoadFilesPage).toHaveBeenLastCalledWith('token', { page: 2 });
    expect(state.list.map((entry) => entry.id)).toEqual([1, 2, 3]);
    expect(state.listNextPage).toBeNull();
  });

  it('keeps the list and reports a retryable error when a later page fails', async () => {
    mockLoadFilesPage.mockResolvedValueOnce(page([1], 'next'));
    await useFilesStore.getState().loadList({});
    mockLoadFilesPage.mockRejectedValueOnce(new Error('offline'));
    await useFilesStore.getState().loadMoreList();

    const state = useFilesStore.getState();

    expect(state.list).toHaveLength(1);
    expect(state.loadMoreError).toBe('safe error');
    expect(state.listNextPage).toBe(2);
  });

  it('drops the answer of an older query when a newer one was started', async () => {
    const slow = deferred<ReturnType<typeof page>>();

    mockLoadFilesPage.mockReturnValueOnce(slow.promise);
    mockLoadFilesPage.mockResolvedValueOnce(page([7]));

    const first = useFilesStore.getState().loadList({ search: 'a' });
    await useFilesStore.getState().loadList({ search: 'ab' });
    slow.resolve(page([1, 2, 3]));
    await first;

    expect(useFilesStore.getState().list.map((entry) => entry.id)).toEqual([7]);
    expect(useFilesStore.getState().listQuery).toEqual({ search: 'ab' });
  });

  it('reports an error on the first page without losing the query', async () => {
    mockLoadFilesPage.mockRejectedValueOnce(new Error('offline'));

    await useFilesStore.getState().loadList({ printableOnly: true });

    const state = useFilesStore.getState();

    expect(state.listError).toBe('safe error');
    expect(state.hasLoadedList).toBe(false);
    expect(state.listQuery).toEqual({ printableOnly: true });
  });
});

describe('files list store offline fallback', () => {
  it('drops the previous rows when another query cannot be loaded (offline, not saved before)', async () => {
    mockLoadFilesPage.mockResolvedValueOnce(page([1, 2], 'next'));
    await useFilesStore.getState().loadList({});
    mockLoadFilesPage.mockRejectedValueOnce(new Error('offline'));
    await useFilesStore.getState().loadList({ search: 'new' });

    const state = useFilesStore.getState();

    expect(state.list).toEqual([]);
    expect(state.listError).toBe('safe error');
    expect(state.listNextPage).toBeNull();
  });

  it('keeps the rows when the same query fails to refresh', async () => {
    mockLoadFilesPage.mockResolvedValueOnce(page([1, 2]));
    await useFilesStore.getState().loadList({});
    mockLoadFilesPage.mockRejectedValueOnce(new Error('offline'));
    await useFilesStore.getState().loadList({});

    expect(useFilesStore.getState().list).toHaveLength(2);
  });
});

describe('files list store search with no connection', () => {
  const networkError = Object.assign(new Error('offline'), { code: 'NETWORK_ERROR' });

  it('answers a never-run search from what is saved on the phone, without an error', async () => {
    useNetworkStore.setState({ isOnline: false });
    mockLoadFilesPage.mockRejectedValue(networkError);
    mockSearchLocalFiles.mockResolvedValue([file(5), file(6)]);

    await useFilesStore.getState().loadList({ search: 'تشريح' });

    const state = useFilesStore.getState();

    expect(mockSearchLocalFiles).toHaveBeenCalledWith('تشريح', {});
    expect(state.list.map((entry) => entry.id)).toEqual([5, 6]);
    expect(state.listIsLocal).toBe(true);
    expect(state.listError).toBeNull();
    expect(state.listNextPage).toBeNull();
    expect(state.isLoadingList).toBe(false);
  });

  it('shows an empty local answer (not an error) when nothing saved matches', async () => {
    useNetworkStore.setState({ isOnline: false });
    mockLoadFilesPage.mockRejectedValue(networkError);
    mockSearchLocalFiles.mockResolvedValue([]);

    await useFilesStore.getState().loadList({ search: 'xyz' });

    const state = useFilesStore.getState();

    expect(state.list).toEqual([]);
    expect(state.listIsLocal).toBe(true);
    expect(state.listError).toBeNull();
  });

  it('runs the search again by itself when the connection is back', async () => {
    useNetworkStore.setState({ isOnline: false });
    mockLoadFilesPage.mockRejectedValueOnce(networkError);
    mockSearchLocalFiles.mockResolvedValue([file(5)]);
    await useFilesStore.getState().loadList({ search: 'تشريح' });

    useNetworkStore.setState({ isOnline: true });
    mockLoadFilesPage.mockResolvedValueOnce(page([5, 8, 9]));
    await useFilesStore.getState().refreshList();

    const state = useFilesStore.getState();

    expect(state.listIsLocal).toBe(false);
    expect(state.list.map((entry) => entry.id)).toEqual([5, 8, 9]);
  });

  it('keeps the error state for a plain list with no search text', async () => {
    useNetworkStore.setState({ isOnline: false });
    mockLoadFilesPage.mockRejectedValue(networkError);

    await useFilesStore.getState().loadList({ ordering: 'title' });

    const state = useFilesStore.getState();

    expect(mockSearchLocalFiles).not.toHaveBeenCalled();
    expect(state.listError).toBe('safe error');
    expect(state.listIsLocal).toBe(false);
  });

  it('does not search locally for a real server refusal while online', async () => {
    mockLoadFilesPage.mockRejectedValue(Object.assign(new Error('no'), { code: 'FORBIDDEN' }));

    await useFilesStore.getState().loadList({ search: 'تشريح' });

    expect(mockSearchLocalFiles).not.toHaveBeenCalled();
    expect(useFilesStore.getState().listError).toBe('safe error');
  });
});
