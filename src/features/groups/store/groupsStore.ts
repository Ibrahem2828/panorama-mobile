import { create } from 'zustand';

import { useLocaleStore } from '../../../i18n';

import { useAuthStore } from '../../auth/store';
import { useFeedbackStore } from '../../feedback/store';
import { useStudentProfileStore } from '../../student-profile';
import {
  loadAvailableGroups,
  loadGroupDetail,
  loadMyGroups,
  loadSubjectLabels,
  optimisticJoinStatus,
  requestJoinGroup,
  requestLeaveGroup,
  toSafeGroupsErrorMessage,
} from '../services';
import type { Group, GroupMembershipStatus, Id, SubjectLabel } from '../types';

export type AvailableGroupsQuery = {
  search: string;
  /** Only the groups of this subject; null = every group of the student's faculty. */
  subjectId: string | null;
};

type GroupsState = {
  availableGroups: Group[];
  myGroups: Group[];
  selectedGroup: Group | null;
  isLoadingAvailable: boolean;
  isLoadingMoreAvailable: boolean;
  isLoadingMyGroups: boolean;
  isLoadingDetail: boolean;
  isRefreshing: boolean;
  isSubmittingMembership: boolean;
  /** Per-group in-flight membership action, so only the touched row shows a spinner. */
  pendingActions: Record<string, 'join' | 'leave'>;
  errorMessage: string | null;
  /** Failure of a join/leave action (the lists stay visible). */
  actionError: string | null;
  successMessage: string | null;
  lastLoadedAt: string | null;
  availableCount: number;
  myGroupsCount: number;
  availablePage: number;
  availableHasMore: boolean;
  availableQuery: AvailableGroupsQuery;
  subjectLabels: Record<string, SubjectLabel>;

  loadAvailableGroups: (query?: Partial<AvailableGroupsQuery>) => Promise<void>;
  loadMoreAvailableGroups: () => Promise<void>;
  loadMyGroups: () => Promise<void>;
  loadGroupDetail: (groupId: Id) => Promise<void>;
  loadSubjectLabels: () => Promise<void>;
  refreshAllGroups: () => Promise<void>;
  joinGroup: (groupId: Id) => Promise<void>;
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

function mergeUnique(current: Group[], incoming: Group[]): Group[] {
  const seen = new Set(current.map((group) => String(group.id)));

  return [...current, ...incoming.filter((group) => !seen.has(String(group.id)))];
}

const initialQuery: AvailableGroupsQuery = { search: '', subjectId: null };

const initialGroupsState = {
  availableGroups: [] as Group[],
  myGroups: [] as Group[],
  selectedGroup: null as Group | null,
  isLoadingAvailable: false,
  isLoadingMoreAvailable: false,
  isLoadingMyGroups: false,
  isLoadingDetail: false,
  isRefreshing: false,
  isSubmittingMembership: false,
  pendingActions: {} as Record<string, 'join' | 'leave'>,
  errorMessage: null as string | null,
  actionError: null as string | null,
  successMessage: null as string | null,
  lastLoadedAt: null as string | null,
  availableCount: 0,
  myGroupsCount: 0,
  availablePage: 0,
  availableHasMore: false,
  availableQuery: initialQuery,
  subjectLabels: {} as Record<string, SubjectLabel>,
};

export const useGroupsStore = create<GroupsState>((set, get) => {
  // Bumped on every first-page request so a slow older answer can never overwrite a newer one.
  let availableRequestId = 0;
  let subjectLabelsRequested = false;

  function requireToken(): string | null {
    const accessToken = getAccessToken();

    if (!accessToken) {
      set({
        errorMessage: groupsCatalog().errors.unauthorized,
        isLoadingAvailable: false,
        isLoadingMyGroups: false,
        isLoadingDetail: false,
        isRefreshing: false,
      });
      return null;
    }

    return accessToken;
  }

  async function fetchFirstAvailablePage(accessToken: string, query: AvailableGroupsQuery) {
    const requestId = (availableRequestId += 1);
    const response = await loadAvailableGroups(accessToken, {
      page: 1,
      search: query.search,
      subject: query.subjectId,
    });

    if (requestId !== availableRequestId) {
      return;
    }

    set({
      availableGroups: response.results,
      availableCount: response.count,
      availablePage: 1,
      availableHasMore: Boolean(response.next),
      lastLoadedAt: new Date().toISOString(),
    });
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
      availableGroups: replaceGroup(state.availableGroups, group),
      myGroups: replaceGroup(state.myGroups, group),
    }));
  }

  function setPending(groupId: Id, action: 'join' | 'leave' | null) {
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
      [state.selectedGroup, ...state.availableGroups, ...state.myGroups].find(
        (group): group is Group => group != null && isSameId(group.id, groupId),
      ) ?? null
    );
  }

  /** Applies a membership status everywhere the group is shown (lists and detail). */
  function applyStatus(
    groupId: Id,
    status: GroupMembershipStatus,
    role?: Group['current_user_group_role'],
  ) {
    set((state) => ({
      availableGroups: patchStatus(state.availableGroups, groupId, status, role),
      myGroups: patchStatus(state.myGroups, groupId, status, role),
      selectedGroup:
        state.selectedGroup && isSameId(state.selectedGroup.id, groupId)
          ? patchStatus([state.selectedGroup], groupId, status, role)[0]
          : state.selectedGroup,
    }));
  }

  return {
    ...initialGroupsState,

    async loadAvailableGroups(query) {
      const accessToken = requireToken();

      if (!accessToken) {
        return;
      }

      const nextQuery = { ...get().availableQuery, ...query };

      set({
        availableQuery: nextQuery,
        isLoadingAvailable: true,
        isLoadingMoreAvailable: false,
        errorMessage: null,
        successMessage: null,
      });

      try {
        await fetchFirstAvailablePage(accessToken, nextQuery);

        if (get().availableQuery === nextQuery) {
          set({ isLoadingAvailable: false });
        }
      } catch (error) {
        // A newer request owns the loading flag, so an outdated failure stays silent.
        if (get().availableQuery === nextQuery) {
          set({
            isLoadingAvailable: false,
            errorMessage: toSafeGroupsErrorMessage(error, groupsCatalog()),
          });
        }
      }
    },

    async loadMoreAvailableGroups() {
      const state = get();

      if (
        state.isLoadingAvailable ||
        state.isLoadingMoreAvailable ||
        !state.availableHasMore ||
        state.availablePage < 1
      ) {
        return;
      }

      const accessToken = requireToken();

      if (!accessToken) {
        return;
      }

      const query = state.availableQuery;
      const requestId = availableRequestId;

      set({ isLoadingMoreAvailable: true, errorMessage: null });

      try {
        const response = await loadAvailableGroups(accessToken, {
          page: state.availablePage + 1,
          search: query.search,
          subject: query.subjectId,
        });

        if (requestId !== availableRequestId) {
          return;
        }

        set((current) => ({
          availableGroups: mergeUnique(current.availableGroups, response.results),
          availablePage: current.availablePage + 1,
          availableHasMore: Boolean(response.next),
          availableCount: response.count,
          isLoadingMoreAvailable: false,
        }));
      } catch (error) {
        if (requestId === availableRequestId) {
          set({
            isLoadingMoreAvailable: false,
            errorMessage: toSafeGroupsErrorMessage(error, groupsCatalog()),
          });
        }
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
        await reloadMyGroups(accessToken);
        set({ isLoadingMyGroups: false, lastLoadedAt: new Date().toISOString() });
      } catch (error) {
        set({
          isLoadingMyGroups: false,
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
          availableGroups: replaceGroup(state.availableGroups, group),
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
          fetchFirstAvailablePage(accessToken, get().availableQuery),
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

    async joinGroup(groupId) {
      if (get().pendingActions[String(groupId)]) {
        return;
      }

      const accessToken = requireToken();

      if (!accessToken) {
        return;
      }

      const previous = findGroup(groupId);
      const optimistic = previous ? optimisticJoinStatus(previous) : 'pending';

      set({ actionError: null, successMessage: null });
      setPending(groupId, 'join');
      applyStatus(groupId, optimistic);

      try {
        const result = await requestJoinGroup(groupId, accessToken);

        if (result.status) {
          applyStatus(groupId, result.status);
        }

        set({ successMessage: groupsCatalog().messages.joinSuccess });
        void useFeedbackStore.getState().requestPrompt({
          context: 'group',
          actionKey: 'group.joined',
          objectType: 'group',
          objectId: groupId,
        });
        // Quiet resync: the server is the source of truth for status, role and members.
        void Promise.all([reloadDetail(groupId, accessToken), reloadMyGroups(accessToken)]).catch(
          () => undefined,
        );
      } catch (error) {
        applyStatus(
          groupId,
          previous?.current_user_membership_status ?? 'none',
          previous?.current_user_group_role,
        );
        set({
          actionError:
            toSafeGroupsErrorMessage(error, groupsCatalog()) || groupsCatalog().messages.joinError,
        });
      } finally {
        setPending(groupId, null);
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
      availableRequestId += 1;
      subjectLabelsRequested = false;
      set(initialGroupsState);
    },
  };
});
