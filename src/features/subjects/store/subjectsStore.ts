import { create } from 'zustand';

import { useLocaleStore } from '../../../i18n';

import { useTermStore } from '../../academic-term/termStore';
import { useAuthStore } from '../../auth/store';
import { loadSubjectCatalog, loadSubjectDetail, toSafeSubjectsErrorMessage } from '../services';
import type { CatalogSubject, Id, TermFilter } from '../types';

type SubjectsState = {
  /** The whole catalogue of the student's faculty; filters are applied on screen. */
  subjects: CatalogSubject[];
  search: string;
  term: TermFilter;
  /** null = every year. */
  academicYearId: Id | null;
  isLoading: boolean;
  isRefreshing: boolean;
  errorMessage: string | null;
  lastLoadedAt: string | null;
  totalCount: number;
  /** Subjects whose full description has been loaded, by id. */
  details: Record<string, CatalogSubject>;
  detailLoadingId: string | null;
  detailErrors: Record<string, string>;

  loadSubjects: () => Promise<void>;
  refreshSubjects: () => Promise<void>;
  loadSubjectDetail: (subjectId: Id) => Promise<void>;
  setSearch: (value: string) => void;
  setTerm: (term: TermFilter) => void;
  setAcademicYear: (academicYearId: Id | null) => void;
  clearError: () => void;
  reset: () => void;
};

// Read when the action runs so the message follows the current locale.
function subjectsCatalog() {
  return useLocaleStore.getState().t.subjects;
}

const initialSubjectsState = {
  subjects: [] as CatalogSubject[],
  search: '',
  term: 'all' as TermFilter,
  academicYearId: null as Id | null,
  isLoading: false,
  isRefreshing: false,
  errorMessage: null as string | null,
  lastLoadedAt: null as string | null,
  totalCount: 0,
  details: {} as Record<string, CatalogSubject>,
  detailLoadingId: null as string | null,
  detailErrors: {} as Record<string, string>,
};

let latestRequest = 0;

export const useSubjectsStore = create<SubjectsState>((set, get) => {
  async function load(mode: 'load' | 'refresh') {
    const { isLoading, isRefreshing, lastLoadedAt } = get();

    if (mode === 'load' && (isLoading || isRefreshing || lastLoadedAt)) {
      return;
    }
    if (mode === 'refresh' && isRefreshing) {
      return;
    }

    latestRequest += 1;
    const requestId = latestRequest;
    const { accessToken } = useAuthStore.getState();

    set({
      isLoading: mode === 'load',
      isRefreshing: mode === 'refresh',
      errorMessage: null,
    });

    // The header chip and the section order need the current term; without it the list still works.
    void useTermStore.getState().loadCurrentTerm();

    try {
      const { subjects, count } = await loadSubjectCatalog(accessToken);

      if (requestId !== latestRequest) {
        return;
      }

      set({
        subjects,
        totalCount: count,
        isLoading: false,
        isRefreshing: false,
        errorMessage: null,
        lastLoadedAt: new Date().toISOString(),
      });
    } catch (error) {
      if (requestId !== latestRequest) {
        return;
      }

      set({
        isLoading: false,
        isRefreshing: false,
        errorMessage: toSafeSubjectsErrorMessage(error, subjectsCatalog()),
      });
    }
  }

  return {
    ...initialSubjectsState,

    async loadSubjects() {
      await load('load');
    },

    async refreshSubjects() {
      await load('refresh');
    },

    async loadSubjectDetail(subjectId) {
      const key = String(subjectId);
      const { accessToken } = useAuthStore.getState();

      set((state) => {
        const detailErrors = { ...state.detailErrors };
        delete detailErrors[key];
        return { detailLoadingId: key, detailErrors };
      });

      try {
        const subject = await loadSubjectDetail(subjectId, accessToken);

        set((state) => ({
          details: { ...state.details, [key]: subject },
          detailLoadingId: state.detailLoadingId === key ? null : state.detailLoadingId,
        }));
      } catch (error) {
        set((state) => ({
          detailLoadingId: state.detailLoadingId === key ? null : state.detailLoadingId,
          detailErrors: {
            ...state.detailErrors,
            [key]: toSafeSubjectsErrorMessage(error, subjectsCatalog()),
          },
        }));
      }
    },

    setSearch(value) {
      set({ search: value });
    },

    setTerm(term) {
      set({ term });
    },

    setAcademicYear(academicYearId) {
      set({ academicYearId });
    },

    clearError() {
      set({ errorMessage: null });
    },

    reset() {
      latestRequest += 1;
      set(initialSubjectsState);
    },
  };
});
