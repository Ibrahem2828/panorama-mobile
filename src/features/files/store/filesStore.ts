import { create } from 'zustand';

import { useAuthStore } from '../../auth/store';
import { loadFileDetail, loadFiles, loadGroupFiles, toSafeFilesErrorMessage } from '../services';
import type { FileResource, Id } from '../types';

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

  loadFiles: () => Promise<void>;
  refreshFiles: () => Promise<void>;
  loadFileDetail: (fileId: Id) => Promise<void>;
  loadGroupFiles: (groupId: Id) => Promise<void>;
  refreshGroupFiles: (groupId: Id) => Promise<void>;
  setSelectedFile: (file: FileResource | null) => void;
  getFileById: (fileId: Id) => FileResource | null;
  clearError: () => void;
};

const MISSING_SESSION_MESSAGE = 'انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى.';

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

export const useFilesStore = create<FilesState>((set, get) => {
  function requireToken(): string | null {
    const accessToken = getAccessToken();

    if (!accessToken) {
      set({
        errorMessage: MISSING_SESSION_MESSAGE,
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
        groupFilesByGroupId: nextGroupFilesByGroupId,
        lastLoadedAt: new Date().toISOString(),
      };
    });
  }

  return {
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
          errorMessage: toSafeFilesErrorMessage(error),
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
          errorMessage: toSafeFilesErrorMessage(error),
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
          errorMessage: toSafeFilesErrorMessage(error),
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
          errorMessage: toSafeFilesErrorMessage(error),
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
          errorMessage: toSafeFilesErrorMessage(error),
        });
      }
    },

    setSelectedFile(file) {
      set({ selectedFile: file });
    },

    getFileById(fileId) {
      const state = get();
      const fromFiles = state.files.find((file) => isSameId(file.id, fileId));

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
  };
});
