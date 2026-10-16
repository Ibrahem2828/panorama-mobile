const mockLoadFilesPage = jest.fn();

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
jest.mock('../services', () => ({
  loadFileDetail: jest.fn(),
  loadFiles: jest.fn(),
  loadGroupFiles: jest.fn(),
  loadFilesPage: (...args: unknown[]) => mockLoadFilesPage(...args),
  toSafeFilesErrorMessage: () => 'safe error',
}));

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
