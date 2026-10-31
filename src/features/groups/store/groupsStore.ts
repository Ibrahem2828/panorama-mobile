import { create } from 'zustand';

import { useLocaleStore } from '../../../i18n';

import { useAuthStore } from '../../auth/store';
import { useStudentProfileStore } from '../../student-profile';
import {
  loadGroupDetail,
  loadMyGroups,
  loadSubjectLabels,
  requestLeaveGroup,
  toSafeGroupsErrorMessage,
} from '../services';
import type { Group, GroupMembershipStatus, Id, SubjectLabel } from '../types';

type GroupsState = {
  myGroups: Group[];
  selectedGroup: Group | null;
  isLoadingMyGroups: boolean;
  /** The last my-groups load failed (so an empty list does not mean 'not a member'). */
  myGroupsLoadFailed: boolean;
  isLoadingDetail: boolean;
  isRefreshing: boolean;
  isSubmittingMembership: boolean;
  /** Per-group in-flight leave, so only the touched row shows a spinner. */
  pendingActions: Record<string, 'leave'>;
  errorMessage: string | null;
  /** Failure of a leave action (the lists stay visible). */
  actionError: string | null;
  successMessage: string | null;
  lastLoadedAt: string | null;
  myGroupsCount: number;
  subjectLabels: Record<string, SubjectLabel>;

  loadMyGroups: () => Promise<void>;
  loadGroupDetail: (groupId: Id) => Promise<void>;
  loadSubjectLabels: () => Promise<void>;
  refreshAllGroups: () => Promise<void>;
  leaveGroup: (groupId: Id) => Promise<void>;
  setSelectedGroup: (group: Group | null) => void;
  clearError: () => void;
  resetSelectedGroup: () => void;
  reset: () => void;
};

// Read when the action runs so the message follows the current locale.
function groupsCatalog() {
  return useLocaleStore.getState().t.groups;
}

function isSameId(left: Id, right: Id): boolean {
  return String(left) === String(right);
}

function getAccessToken(): string | null {
  return useAuthStore.getState().accessToken;
}

function getFacultyId(): Id | null {
  const profile = useStudentProfileStore.getState();
  const faculty: unknown = profile.profile?.faculty ?? profile.selectedFacultyId;

  if (typeof faculty === 'string' || typeof faculty === 'number') {
    return faculty;
  }

  if (typeof faculty === 'object' && faculty !== null) {
    const id = (faculty as { id?: unknown }).id;

    return typeof id === 'string' || typeof id === 'number' ? id : null;
  }

  return null;
}

function replaceGroup(groups: Group[], nextGroup: Group): Group[] {
  const index = groups.findIndex((group) => isSameId(group.id, nextGroup.id));

  return index === -1
    ? groups
    : groups.map((group, position) => (position === index ? nextGroup : group));
}

function patchStatus(
  groups: Group[],
  groupId: Id,
  status: GroupMembershipStatus,
  role?: Group['current_user_group_role'],
): Group[] {
  return groups.map((group) =>
    isSameId(group.id, groupId)
      ? {
          ...group,
          current_user_membership_status: status,
          current_user_group_role: role === undefined ? group.current_user_group_role : role,
        }
      : group,
  );
}

const initialGroupsState = {
  myGroups: [] as Group[],
  selectedGroup: null as Group | null,
  isLoadingMyGroups: false,
  myGroupsLoadFailed: false,
  isLoadingDetail: false,
  isRefreshing: false,
  isSubmittingMembership: false,
  pendingActions: {} as Record<string, 'leave'>,
  errorMessage: null as string | null,
  actionError: null as string | null,
  successMessage: null as string | null,
  lastLoadedAt: null as string | null,
  myGroupsCount: 0,
  subjectLabels: {} as Record<string, SubjectLabel>,
};

export const useGroupsStore = create<GroupsState>((set, get) => {
  let subjectLabelsRequested = false;

  function requireToken(): string | null {
    const accessToken = getAccessToken();

    if (!accessToken) {
      set({
        errorMessage: groupsCatalog().errors.unauthorized,
        isLoadingMyGroups: false,
        isLoadingDetail: false,
        isRefreshing: false,
      });
      return null;
    }

    return accessToken;
  }

  async function reloadMyGroups(accessToken: string) {
    const response = await loadMyGroups(accessToken);

    set({ myGroups: response.results, myGroupsCount: response.count });
  }

  async function reloadDetail(groupId: Id, accessToken: string) {
    const group = await loadGroupDetail(groupId, accessToken);

    set((state) => ({
      selectedGroup:
        state.selectedGroup === null || isSameId(state.selectedGroup.id, groupId)
          ? group
          : state.selectedGroup,
      myGroups: replaceGroup(state.myGroups, group),
    }));
  }

  function setPending(groupId: Id, action: 'leave' | null) {
    set((state) => {
      const pendingActions = { ...state.pendingActions };

      if (action) {
        pendingActions[String(groupId)] = action;
      } else {
        delete pendingActions[String(groupId)];
      }

      return { pendingActions, isSubmittingMembership: Object.keys(pendingActions).length > 0 };
    });
  }

  function findGroup(groupId: Id): Group | null {
    const state = get();

    return (
      [state.selectedGroup, ...state.myGroups].find(
        (group): group is Group => group != null && isSameId(group.id, groupId),
      ) ?? null
    );
  }

  /** Applies a membership status everywhere the group is shown (list and detail). */
  function applyStatus(
    groupId: Id,
    status: GroupMembershipStatus,
    role?: Group['current_user_group_role'],
  ) {
    set((state) => ({
      myGroups: patchStatus(state.myGroups, groupId, status, role),
      selectedGroup:
        state.selectedGroup && isSameId(state.selectedGroup.id, groupId)
          ? patchStatus([state.selectedGroup], groupId, status, role)[0]
          : state.selectedGroup,
    }));
  }

  return {
    ...initialGroupsState,

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
        await reloadMyGroups(accessToken);
        set({
          isLoadingMyGroups: false,
          myGroupsLoadFailed: false,
          lastLoadedAt: new Date().toISOString(),
        });
      } catch (error) {
        set({
          isLoadingMyGroups: false,
          myGroupsLoadFailed: true,
          errorMessage: toSafeGroupsErrorMessage(error, groupsCatalog()),
        });
      }
    },

    async loadGroupDetail(groupId) {
      const accessToken = requireToken();

      if (!accessToken) {
        return;
      }

      set({ isLoadingDetail: true, errorMessage: null, successMessage: null });

      try {
        const group = await loadGroupDetail(groupId, accessToken);

        set((state) => ({
          selectedGroup: group,
          myGroups: replaceGroup(state.myGroups, group),
          isLoadingDetail: false,
          lastLoadedAt: new Date().toISOString(),
        }));
      } catch (error) {
        set({
          isLoadingDetail: false,
          errorMessage: toSafeGroupsErrorMessage(error, groupsCatalog()),
        });
      }
    },

    async loadSubjectLabels() {
      if (subjectLabelsRequested) {
        return;
      }

      const accessToken = getAccessToken();
      const facultyId = getFacultyId();

      if (!accessToken || facultyId === null) {
        return;
      }

      subjectLabelsRequested = true;

      try {
        set({ subjectLabels: await loadSubjectLabels(facultyId, accessToken) });
      } catch {
        // Labels are cosmetic: allow a retry next time and fall back to the group name.
        subjectLabelsRequested = false;
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
        const selectedGroup = get().selectedGroup;

        await Promise.all([
          reloadMyGroups(accessToken),
          selectedGroup ? reloadDetail(selectedGroup.id, accessToken) : Promise.resolve(),
        ]);

        set({ isRefreshing: false });
      } catch (error) {
        set({
          isRefreshing: false,
          errorMessage: toSafeGroupsErrorMessage(error, groupsCatalog()),
        });
      }
    },

    async leaveGroup(groupId) {
      if (get().pendingActions[String(groupId)]) {
        return;
      }

      const accessToken = requireToken();

      if (!accessToken) {
        return;
      }

      const previous = findGroup(groupId);
      const previousMyGroups = get().myGroups;
      const previousMyCount = get().myGroupsCount;

      set({ actionError: null, successMessage: null });
      setPending(groupId, 'leave');
      applyStatus(groupId, 'left');
      set((state) => ({
        myGroups: state.myGroups.filter((group) => !isSameId(group.id, groupId)),
        myGroupsCount: Math.max(0, state.myGroupsCount - 1),
      }));

      try {
        await requestLeaveGroup(groupId, accessToken);
        set({ successMessage: groupsCatalog().messages.leaveSuccess });
        void Promise.all([reloadDetail(groupId, accessToken), reloadMyGroups(accessToken)]).catch(
          () => undefined,
        );
      } catch (error) {
        applyStatus(
          groupId,
          previous?.current_user_membership_status ?? 'approved',
          previous?.current_user_group_role,
        );
        set({
          myGroups: previousMyGroups,
          myGroupsCount: previousMyCount,
          actionError:
            toSafeGroupsErrorMessage(error, groupsCatalog()) || groupsCatalog().messages.leaveError,
        });
      } finally {
        setPending(groupId, null);
      }
    },

    setSelectedGroup(group) {
      set({ selectedGroup: group });
    },

    clearError() {
      set({ errorMessage: null, actionError: null, successMessage: null });
    },

    resetSelectedGroup() {
      set({ selectedGroup: null });
    },

    reset() {
      subjectLabelsRequested = false;
      set(initialGroupsState);
    },
  };
});
