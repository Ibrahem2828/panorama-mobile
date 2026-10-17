import { create } from 'zustand';

import { useLocaleStore } from '../../../i18n';

import { useAuthStore } from '../../auth/store';
import {
  loadFileDetail,
  loadFiles,
  loadFilesPage,
  loadGroupFiles,
  toSafeFilesErrorMessage,
} from '../services';
import type { FileResource, FilesListQuery, Id } from '../types';

type FilesState = {
  files: FileResource[];
  groupFilesByGroupId: Record<string, FileResource[]>;
  selectedFile: FileResource | null;
  isLoadingFiles: boolean;
  isLoadingDetail: boolean;
  isLoadingGroupFiles: boolean;
  isRefreshing: boolean;
  errorMessage: string | null;
  lastLoadedAt: string | null;
  filesCount: number;
  groupFilesCountByGroupId: Record<string, number>;
  /** The searchable, filterable, paginated list shown by the files screen. */
  list: FileResource[];
  listCount: number;
  listNextPage: number | null;
  listQuery: FilesListQuery;
  hasLoadedList: boolean;
  isLoadingList: boolean;
  isLoadingMoreList: boolean;
  isRefreshingList: boolean;
  listError: string | null;
  loadMoreError: string | null;

  loadList: (query: FilesListQuery) => Promise<void>;
  refreshList: () => Promise<void>;
  loadMoreList: () => Promise<void>;
  loadFiles: () => Promise<void>;
  refreshFiles: () => Promise<void>;
  loadFileDetail: (fileId: Id) => Promise<void>;
  loadGroupFiles: (groupId: Id) => Promise<void>;
  refreshGroupFiles: (groupId: Id) => Promise<void>;
  setSelectedFile: (file: FileResource | null) => void;
  getFileById: (fileId: Id) => FileResource | null;
  clearError: () => void;
  reset: () => void;
};

// Read when the action runs so the message follows the current locale.
function filesCatalog() {
  return useLocaleStore.getState().t.files;
}

function isSameId(left: Id, right: Id): boolean {
  return String(left) === String(right);
}

function getGroupKey(groupId: Id): string {
  return String(groupId);
}

function getAccessToken(): string | null {
  return useAuthStore.getState().accessToken;
}

function upsertFile(files: FileResource[], nextFile: FileResource): FileResource[] {
  const existingIndex = files.findIndex((file) => isSameId(file.id, nextFile.id));

  if (existingIndex === -1) {
    return files;
  }

  return files.map((file, index) => (index === existingIndex ? nextFile : file));
}

const initialFilesState = {
  files: [],
  groupFilesByGroupId: {},
  selectedFile: null,
  isLoadingFiles: false,
  isLoadingDetail: false,
  isLoadingGroupFiles: false,
  isRefreshing: false,
  errorMessage: null,
  lastLoadedAt: null,
  filesCount: 0,
  groupFilesCountByGroupId: {},
  list: [] as FileResource[],
  listCount: 0,
  listNextPage: null as number | null,
  listQuery: {} as FilesListQuery,
  hasLoadedList: false,
  isLoadingList: false,
  isLoadingMoreList: false,
  isRefreshingList: false,
  listError: null as string | null,
  loadMoreError: null as string | null,
};

/** Only the newest list request may write results; older ones are dropped. */
let listRequestId = 0;

export const useFilesStore = create<FilesState>((set, get) => {
  function requireToken(): string | null {
    const accessToken = getAccessToken();

    if (!accessToken) {
      set({
        errorMessage: filesCatalog().errors.unauthorized,
        isLoadingFiles: false,
        isLoadingDetail: false,
        isLoadingGroupFiles: false,
        isRefreshing: false,
      });
      return null;
    }

    return accessToken;
  }

  async function reloadFiles(accessToken: string) {
    const response = await loadFiles(accessToken);

    set({
      files: response.results,
      filesCount: response.count,
      lastLoadedAt: new Date().toISOString(),
    });
  }

  async function reloadGroupFiles(groupId: Id, accessToken: string) {
    const groupKey = getGroupKey(groupId);
    const response = await loadGroupFiles(groupId, accessToken);

    set((state) => ({
      groupFilesByGroupId: {
        ...state.groupFilesByGroupId,
        [groupKey]: response.results,
      },
      groupFilesCountByGroupId: {
        ...state.groupFilesCountByGroupId,
        [groupKey]: response.count,
      },
      lastLoadedAt: new Date().toISOString(),
    }));
  }

  async function reloadFileDetail(fileId: Id, accessToken: string) {
    const file = await loadFileDetail(fileId, accessToken);

    set((state) => {
      const nextGroupFilesByGroupId = Object.fromEntries(
        Object.entries(state.groupFilesByGroupId).map(([groupId, groupFiles]) => [
          groupId,
          upsertFile(groupFiles, file),
        ]),
      );

      return {
        selectedFile: file,
        files: upsertFile(state.files, file),
        list: upsertFile(state.list, file),
        groupFilesByGroupId: nextGroupFilesByGroupId,
        lastLoadedAt: new Date().toISOString(),
      };
    });
  }

  async function fetchListFirstPage(query: FilesListQuery, mode: 'load' | 'refresh') {
    const accessToken = getAccessToken();

    if (!accessToken) {
      set({ listError: filesCatalog().errors.unauthorized });
      return;
    }

    const requestId = ++listRequestId;

    set(
      mode === 'load'
        ? { isLoadingList: true, isRefreshingList: false, listError: null, listQuery: query }
        : { isRefreshingList: true, listError: null },
    );

    try {
      const response = await loadFilesPage(accessToken, { ...query, page: 1 });

      if (requestId !== listRequestId) {
        return;
      }

      set({
        list: response.results,
        listCount: response.count,
        listNextPage: response.next ? 2 : null,
        hasLoadedList: true,
        isLoadingList: false,
        isRefreshingList: false,
        loadMoreError: null,
        lastLoadedAt: new Date().toISOString(),
      });
    } catch (error) {
      if (requestId !== listRequestId) {
        return;
      }

      set({
        isLoadingList: false,
        isRefreshingList: false,
        listError: toSafeFilesErrorMessage(error, filesCatalog()),
      });
    }
  }

  return {
    ...initialFilesState,

    async loadList(query) {
      await fetchListFirstPage(query, 'load');
    },

    async refreshList() {
      if (get().isRefreshingList) {
        return;
      }

      await fetchListFirstPage(get().listQuery, 'refresh');
    },

    async loadMoreList() {
      const { listNextPage, isLoadingMoreList, isLoadingList, isRefreshingList, listQuery } = get();
      const accessToken = getAccessToken();

      if (
        listNextPage === null ||
        isLoadingMoreList ||
        isLoadingList ||
        isRefreshingList ||
        !accessToken
      ) {
        return;
      }

      const requestId = listRequestId;

      set({ isLoadingMoreList: true, loadMoreError: null });

      try {
        const response = await loadFilesPage(accessToken, { ...listQuery, page: listNextPage });

        if (requestId !== listRequestId) {
          set({ isLoadingMoreList: false });
          return;
        }

        set((state) => {
          const known = new Set(state.list.map((file) => String(file.id)));

          return {
            list: [
              ...state.list,
              ...response.results.filter((file) => !known.has(String(file.id))),
            ],
            listCount: response.count,
            listNextPage: response.next ? listNextPage + 1 : null,
            isLoadingMoreList: false,
          };
        });
      } catch (error) {
        set({
          isLoadingMoreList: false,
          loadMoreError: toSafeFilesErrorMessage(error, filesCatalog()),
        });
      }
    },

    async loadFiles() {
      if (get().isLoadingFiles) {
        return;
      }

      const accessToken = requireToken();

      if (!accessToken) {
        return;
      }

      set({ isLoadingFiles: true, errorMessage: null });

      try {
        await reloadFiles(accessToken);
        set({ isLoadingFiles: false });
      } catch (error) {
        set({
          isLoadingFiles: false,
          errorMessage: toSafeFilesErrorMessage(error, filesCatalog()),
        });
      }
    },

    async refreshFiles() {
      if (get().isRefreshing) {
        return;
      }

      const accessToken = requireToken();

      if (!accessToken) {
        return;
      }

      set({ isRefreshing: true, errorMessage: null });

      try {
        await reloadFiles(accessToken);
        set({ isRefreshing: false });
      } catch (error) {
        set({
          isRefreshing: false,
          errorMessage: toSafeFilesErrorMessage(error, filesCatalog()),
        });
      }
    },

    async loadFileDetail(fileId) {
      if (get().isLoadingDetail) {
        return;
      }

      const accessToken = requireToken();

      if (!accessToken) {
        return;
      }

      set({ isLoadingDetail: true, errorMessage: null });

      try {
        await reloadFileDetail(fileId, accessToken);
        set({ isLoadingDetail: false });
      } catch (error) {
        set({
          isLoadingDetail: false,
          errorMessage: toSafeFilesErrorMessage(error, filesCatalog()),
        });
      }
    },

    async loadGroupFiles(groupId) {
      if (get().isLoadingGroupFiles) {
        return;
      }

      const accessToken = requireToken();

      if (!accessToken) {
        return;
      }

      set({ isLoadingGroupFiles: true, errorMessage: null });

      try {
        await reloadGroupFiles(groupId, accessToken);
        set({ isLoadingGroupFiles: false });
      } catch (error) {
        set({
          isLoadingGroupFiles: false,
          errorMessage: toSafeFilesErrorMessage(error, filesCatalog()),
        });
      }
    },

    async refreshGroupFiles(groupId) {
      if (get().isRefreshing) {
        return;
      }

      const accessToken = requireToken();

      if (!accessToken) {
        return;
      }

      set({ isRefreshing: true, errorMessage: null });

      try {
        await reloadGroupFiles(groupId, accessToken);
        set({ isRefreshing: false });
      } catch (error) {
        set({
          isRefreshing: false,
          errorMessage: toSafeFilesErrorMessage(error, filesCatalog()),
        });
      }
    },

    setSelectedFile(file) {
      set({ selectedFile: file });
    },

    getFileById(fileId) {
      const state = get();
      const fromFiles =
        state.files.find((file) => isSameId(file.id, fileId)) ??
        state.list.find((file) => isSameId(file.id, fileId));

      if (fromFiles) {
        return fromFiles;
      }

      for (const groupFiles of Object.values(state.groupFilesByGroupId)) {
        const fromGroupFiles = groupFiles.find((file) => isSameId(file.id, fileId));

        if (fromGroupFiles) {
          return fromGroupFiles;
        }
      }

      return null;
    },

    clearError() {
      set({ errorMessage: null });
    },

    reset() {
      listRequestId += 1;
      set(initialFilesState);
    },
  };
});
