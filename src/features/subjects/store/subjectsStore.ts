import { create } from 'zustand';

import { useAuthStore } from '../../auth/store';
import { getStudentProfileAcademicYear, useStudentProfileStore } from '../../student-profile';
import { loadSubjectsForMajor, toSafeSubjectsErrorMessage } from '../services';
import type { Id, Subject, SubjectListStateSource } from '../types';

type SubjectsState = {
  subjects: Subject[];
  selectedSubject: Subject | null;
  search: string;
  isLoading: boolean;
  isRefreshing: boolean;
  errorMessage: string | null;
  lastLoadedAt: string | null;
  lastLoadKey: string | null;
  totalCount: number;
  stateSource: SubjectListStateSource;

  loadSubjects: () => Promise<void>;
  refreshSubjects: () => Promise<void>;
  setSearch: (value: string) => void;
  setSelectedSubject: (subject: Subject | null) => void;
  getSubjectById: (subjectId: Id) => Subject | null;
  clearError: () => void;
  reset: () => void;
};

const MISSING_MAJOR_MESSAGE = 'لا يمكن تحميل المواد قبل إكمال البيانات الأكاديمية.';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toId(value: unknown): Id | null {
  if (typeof value === 'string' || typeof value === 'number') {
    return value;
  }

  if (isRecord(value)) {
    const id = value.id;

    if (typeof id === 'string' || typeof id === 'number') {
      return id;
    }
  }

  return null;
}

function isSameId(left: Id, right: Id): boolean {
  return String(left) === String(right);
}

function getAcademicIdentity() {
  const studentProfileState = useStudentProfileStore.getState();
  const profile = studentProfileState.profile;
  const majorId = toId(profile?.major) ?? studentProfileState.selectedMajorId;
  const academicYearId =
    toId(getStudentProfileAcademicYear(profile)) ?? studentProfileState.selectedAcademicYearId;
  const semesterId = toId(profile?.semester) ?? studentProfileState.selectedSemesterId;

  return {
    majorId,
    academicYearId,
    semesterId,
    source: majorId ? ('studentProfile' as const) : ('unknown' as const),
  };
}

function buildLoadKey(input: {
  userId: Id | null;
  majorId: Id;
  academicYearId?: Id | null;
  semesterId?: Id | null;
}) {
  return [
    input.userId ?? 'anonymous',
    input.majorId,
    input.academicYearId ?? 'all-years',
    input.semesterId ?? 'all-semesters',
  ].join(':');
}

const initialSubjectsState = {
  subjects: [],
  selectedSubject: null,
  search: '',
  isLoading: false,
  isRefreshing: false,
  errorMessage: null,
  lastLoadedAt: null,
  lastLoadKey: null,
  totalCount: 0,
  stateSource: 'unknown' as const,
};

export const useSubjectsStore = create<SubjectsState>((set, get) => {
  async function load(mode: 'load' | 'refresh') {
    const { isLoading, isRefreshing, lastLoadedAt, lastLoadKey } = get();

    if (isLoading || isRefreshing) {
      return;
    }

    const { accessToken, user } = useAuthStore.getState();
    const { majorId, academicYearId, semesterId, source } = getAcademicIdentity();

    if (!majorId) {
      set({
        subjects: [],
        selectedSubject: null,
        isLoading: false,
        isRefreshing: false,
        errorMessage: MISSING_MAJOR_MESSAGE,
        lastLoadedAt: null,
        lastLoadKey: null,
        totalCount: 0,
        stateSource: source,
      });
      return;
    }

    const nextLoadKey = buildLoadKey({
      userId: user?.id ?? null,
      majorId,
      academicYearId,
      semesterId,
    });

    if (mode === 'load' && lastLoadedAt && lastLoadKey === nextLoadKey) {
      return;
    }

    set({
      isLoading: mode === 'load',
      isRefreshing: mode === 'refresh',
      errorMessage: null,
      stateSource: source,
    });

    try {
      const response = await loadSubjectsForMajor({
        majorId,
        academicYearId,
        semesterId,
        authToken: accessToken,
      });
      const selectedSubject = get().selectedSubject;
      const nextSelectedSubject = selectedSubject
        ? (response.results.find((subject) => isSameId(subject.id, selectedSubject.id)) ?? null)
        : null;

      set({
        subjects: response.results,
        selectedSubject: nextSelectedSubject,
        isLoading: false,
        isRefreshing: false,
        errorMessage: null,
        lastLoadedAt: new Date().toISOString(),
        lastLoadKey: nextLoadKey,
        totalCount: response.count,
      });
    } catch (error) {
      set({
        isLoading: false,
        isRefreshing: false,
        errorMessage: toSafeSubjectsErrorMessage(error),
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

    setSearch(value) {
      set({ search: value });
    },

    setSelectedSubject(subject) {
      set({ selectedSubject: subject });
    },

    getSubjectById(subjectId) {
      return get().subjects.find((subject) => isSameId(subject.id, subjectId)) ?? null;
    },

    clearError() {
      set({ errorMessage: null });
    },

    reset() {
      set(initialSubjectsState);
    },
  };
});
