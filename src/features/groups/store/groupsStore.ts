import { create } from 'zustand';

import { useAuthStore } from '../../auth/store';
import { useFeedbackStore } from '../../feedback/store';
import {
  loadAvailableGroups,
  loadGroupDetail,
  loadMyGroups,
  requestJoinGroup,
  requestLeaveGroup,
  toSafeGroupsErrorMessage,
} from '../services';
import type { Group, Id } from '../types';

type GroupsState = {
  availableGroups: Group[];
  myGroups: Group[];
  selectedGroup: Group | null;
  isLoadingAvailable: boolean;
  isLoadingMyGroups: boolean;
  isLoadingDetail: boolean;
  isRefreshing: boolean;
  isSubmittingMembership: boolean;
  errorMessage: string | null;
  successMessage: string | null;
  lastLoadedAt: string | null;
  availableCount: number;
  myGroupsCount: number;

  loadAvailableGroups: () => Promise<void>;
  loadMyGroups: () => Promise<void>;
  loadGroupDetail: (groupId: Id) => Promise<void>;
  refreshAllGroups: () => Promise<void>;
  joinGroup: (groupId: Id) => Promise<void>;
  leaveGroup: (groupId: Id) => Promise<void>;
  setSelectedGroup: (group: Group | null) => void;
  clearError: () => void;
  resetSelectedGroup: () => void;
  reset: () => void;
};

const MISSING_SESSION_MESSAGE = 'انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى.';
const JOIN_SUCCESS_MESSAGE = 'تم إرسال طلب الانضمام.';
const LEAVE_SUCCESS_MESSAGE = 'تمت مغادرة المجموعة.';
const JOIN_ERROR_MESSAGE = 'تعذر إرسال طلب الانضمام.';
const LEAVE_ERROR_MESSAGE = 'تعذر مغادرة المجموعة.';

function isSameId(left: Id, right: Id): boolean {
  return String(left) === String(right);
}

function getAccessToken(): string | null {
  return useAuthStore.getState().accessToken;
}

function upsertGroup(groups: Group[], nextGroup: Group): Group[] {
  const existingIndex = groups.findIndex((group) => isSameId(group.id, nextGroup.id));

  if (existingIndex === -1) {
    return groups;
  }

  return groups.map((group, index) => (index === existingIndex ? nextGroup : group));
}

const initialGroupsState = {
  availableGroups: [],
  myGroups: [],
  selectedGroup: null,
  isLoadingAvailable: false,
  isLoadingMyGroups: false,
  isLoadingDetail: false,
  isRefreshing: false,
  isSubmittingMembership: false,
  errorMessage: null,
  successMessage: null,
  lastLoadedAt: null,
  availableCount: 0,
  myGroupsCount: 0,
};

export const useGroupsStore = create<GroupsState>((set, get) => {
  function requireToken(): string | null {
    const accessToken = getAccessToken();

    if (!accessToken) {
      set({
        errorMessage: MISSING_SESSION_MESSAGE,
        isLoadingAvailable: false,
        isLoadingMyGroups: false,
        isLoadingDetail: false,
        isRefreshing: false,
        isSubmittingMembership: false,
      });
      return null;
    }

    return accessToken;
  }

  async function reloadLists(accessToken: string) {
    const [availableGroupsResponse, myGroupsResponse] = await Promise.all([
      loadAvailableGroups(accessToken),
      loadMyGroups(accessToken),
    ]);

    set({
      availableGroups: availableGroupsResponse.results,
      myGroups: myGroupsResponse.results,
      availableCount: availableGroupsResponse.count,
      myGroupsCount: myGroupsResponse.count,
      lastLoadedAt: new Date().toISOString(),
    });
  }

  async function reloadDetail(groupId: Id, accessToken: string) {
    const group = await loadGroupDetail(groupId, accessToken);

    set((state) => ({
      selectedGroup: group,
      availableGroups: upsertGroup(state.availableGroups, group),
      myGroups: upsertGroup(state.myGroups, group),
    }));
  }

  return {
    ...initialGroupsState,

    async loadAvailableGroups() {
      if (get().isLoadingAvailable) {
        return;
      }

      const accessToken = requireToken();

      if (!accessToken) {
        return;
      }

      set({ isLoadingAvailable: true, errorMessage: null, successMessage: null });

      try {
        const response = await loadAvailableGroups(accessToken);

        set({
          availableGroups: response.results,
          availableCount: response.count,
          isLoadingAvailable: false,
          lastLoadedAt: new Date().toISOString(),
        });
      } catch (error) {
        set({
          isLoadingAvailable: false,
          errorMessage: toSafeGroupsErrorMessage(error),
        });
      }
    },

    async loadMyGroups() {
      if (get().isLoadingMyGroups) {
        return;
      }

      const accessToken = requireToken();

      if (!accessToken) {
        return;
      }

      set({ isLoadingMyGroups: true, errorMessage: null, successMessage: null });

      try {
        const response = await loadMyGroups(accessToken);

        set({
          myGroups: response.results,
          myGroupsCount: response.count,
          isLoadingMyGroups: false,
          lastLoadedAt: new Date().toISOString(),
        });
      } catch (error) {
        set({
          isLoadingMyGroups: false,
          errorMessage: toSafeGroupsErrorMessage(error),
        });
      }
    },

    async loadGroupDetail(groupId) {
      if (get().isLoadingDetail) {
        return;
      }

      const accessToken = requireToken();

      if (!accessToken) {
        return;
      }

      set({ isLoadingDetail: true, errorMessage: null, successMessage: null });

      try {
        await reloadDetail(groupId, accessToken);

        set({
          isLoadingDetail: false,
          lastLoadedAt: new Date().toISOString(),
        });
      } catch (error) {
        set({
          isLoadingDetail: false,
          errorMessage: toSafeGroupsErrorMessage(error),
        });
      }
    },

    async refreshAllGroups() {
      if (get().isRefreshing) {
        return;
      }

      const accessToken = requireToken();

      if (!accessToken) {
        return;
      }

      set({ isRefreshing: true, errorMessage: null, successMessage: null });

      try {
        await reloadLists(accessToken);

        const selectedGroup = get().selectedGroup;

        if (selectedGroup) {
          await reloadDetail(selectedGroup.id, accessToken);
        }

        set({ isRefreshing: false });
      } catch (error) {
        set({
          isRefreshing: false,
          errorMessage: toSafeGroupsErrorMessage(error),
        });
      }
    },

    async joinGroup(groupId) {
      if (get().isSubmittingMembership) {
        return;
      }

      const accessToken = requireToken();

      if (!accessToken) {
        return;
      }

      set({ isSubmittingMembership: true, errorMessage: null, successMessage: null });

      try {
        await requestJoinGroup(groupId, accessToken);
        await Promise.all([reloadLists(accessToken), reloadDetail(groupId, accessToken)]);

        set({
          isSubmittingMembership: false,
          successMessage: JOIN_SUCCESS_MESSAGE,
        });
        void useFeedbackStore.getState().requestPrompt({
          context: 'group',
          actionKey: 'group.joined',
          objectType: 'group',
          objectId: groupId,
        });
      } catch (error) {
        set({
          isSubmittingMembership: false,
          errorMessage: toSafeGroupsErrorMessage(error) || JOIN_ERROR_MESSAGE,
        });
      }
    },

    async leaveGroup(groupId) {
      if (get().isSubmittingMembership) {
        return;
      }

      const accessToken = requireToken();

      if (!accessToken) {
        return;
      }

      set({ isSubmittingMembership: true, errorMessage: null, successMessage: null });

      try {
        await requestLeaveGroup(groupId, accessToken);
        await Promise.all([reloadLists(accessToken), reloadDetail(groupId, accessToken)]);

        set({
          isSubmittingMembership: false,
          successMessage: LEAVE_SUCCESS_MESSAGE,
        });
      } catch (error) {
        set({
          isSubmittingMembership: false,
          errorMessage: toSafeGroupsErrorMessage(error) || LEAVE_ERROR_MESSAGE,
        });
      }
    },

    setSelectedGroup(group) {
      set({ selectedGroup: group });
    },

    clearError() {
      set({ errorMessage: null, successMessage: null });
    },

    resetSelectedGroup() {
      set({ selectedGroup: null });
    },

    reset() {
      set(initialGroupsState);
    },
  };
});
