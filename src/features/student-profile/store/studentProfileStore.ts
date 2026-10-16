import { create } from 'zustand';

import { useLocaleStore } from '../../../i18n';

import { useAuthStore } from '../../auth/store';
import {
  getAcademicSetupOptions,
  getMyStudentProfile,
  getStudentProfileAcademicYear,
  getStudentProfileStudentNumber,
  listFacultiesForUniversity,
  listMajorsForFaculty,
  countSubjectsForFaculty,
  parseStudentNumber,
  toSafeStudentProfileErrorMessage,
  updateMyStudentProfile,
} from '../services';
import type {
  AcademicOption,
  AcademicSubject,
  ParsedStudentNumber,
  StudentProfile,
  StudentProfileBootstrapOptions,
  StudentProfileUpdateInput,
} from '../types';

type StudentProfileState = {
  profile: StudentProfile | null;
  universities: AcademicOption[];
  faculties: AcademicOption[];
  majors: AcademicOption[];
  academicYears: AcademicOption[];
  semesters: AcademicOption[];
  subjects: AcademicSubject[];
  facultySubjectsCount: number;
  selectedUniversityId: string | number | null;
  selectedFacultyId: string | number | null;
  selectedMajorId: string | number | null;
  selectedAcademicYearId: string | number | null;
  selectedSemesterId: string | number | null;
  studentNumber: string;
  parsedStudentNumber: ParsedStudentNumber | null;
  hasBootstrapped: boolean;
  lastAuthUserId: string | number | null;
  isBootstrapping: boolean;
  isLoadingOptions: boolean;
  isLoadingFaculties: boolean;
  isLoadingMajors: boolean;
  isLoadingSubjects: boolean;
  isParsingStudentNumber: boolean;
  isSubmitting: boolean;
  errorMessage: string | null;
  parseErrorMessage: string | null;

  bootstrap: (options?: StudentProfileBootstrapOptions) => Promise<void>;
  loadBaseAcademicOptions: () => Promise<void>;
  selectUniversity: (universityId: string | number | null) => Promise<void>;
  selectFaculty: (facultyId: string | number | null) => Promise<void>;
  selectMajor: (majorId: string | number | null) => Promise<void>;
  selectAcademicYear: (academicYearId: string | number | null) => void;
  selectSemester: (semesterId: string | number | null) => void;
  setStudentNumber: (studentNumber: string) => void;
  parseCurrentStudentNumber: () => Promise<ParsedStudentNumber | null>;
  submitProfile: () => Promise<StudentProfile>;
  clearError: () => void;
  reset: () => void;
};

type AuthContext = {
  accessToken: string;
  userId: string | number | null;
};

// Read when the action runs so the message follows the current locale.
function studentProfileCatalog() {
  return useLocaleStore.getState().t.studentProfile;
}

function getInitialDataState() {
  return {
    profile: null,
    universities: [],
    faculties: [],
    majors: [],
    academicYears: [],
    semesters: [],
    subjects: [],
    facultySubjectsCount: 0,
    selectedUniversityId: null,
    selectedFacultyId: null,
    selectedMajorId: null,
    selectedAcademicYearId: null,
    selectedSemesterId: null,
    studentNumber: '',
    parsedStudentNumber: null,
    hasBootstrapped: false,
    lastAuthUserId: null,
    isBootstrapping: false,
    isLoadingOptions: false,
    isLoadingFaculties: false,
    isLoadingMajors: false,
    isLoadingSubjects: false,
    isParsingStudentNumber: false,
    isSubmitting: false,
    errorMessage: null,
    parseErrorMessage: null,
  };
}

function requireAuthContext(): AuthContext {
  const { accessToken, user } = useAuthStore.getState();

  if (!accessToken) {
    throw new Error(studentProfileCatalog().errors.unauthorized);
  }

  return {
    accessToken,
    userId: user?.id ?? null,
  };
}

function toEntityId(option: AcademicOption | null | undefined) {
  return option?.id ?? null;
}

function buildProfileInput(state: StudentProfileState): StudentProfileUpdateInput | null {
  const studentNumber = state.studentNumber.trim();

  if (
    !state.selectedUniversityId ||
    !state.selectedFacultyId ||
    !state.selectedAcademicYearId ||
    !state.selectedSemesterId ||
    !studentNumber
  ) {
    return null;
  }

  return {
    university: state.selectedUniversityId,
    faculty: state.selectedFacultyId,
    ...(state.selectedMajorId ? { major: state.selectedMajorId } : {}),
    academic_year: state.selectedAcademicYearId,
    semester: state.selectedSemesterId,
    student_number: studentNumber,
  };
}

function getHydratedSelection(profile: StudentProfile | null) {
  return {
    selectedUniversityId: toEntityId(profile?.university),
    selectedFacultyId: toEntityId(profile?.faculty),
    selectedMajorId: toEntityId(profile?.major),
    selectedAcademicYearId: toEntityId(getStudentProfileAcademicYear(profile)),
    selectedSemesterId: toEntityId(profile?.semester),
    studentNumber: getStudentProfileStudentNumber(profile) ?? '',
  };
}

export const useStudentProfileStore = create<StudentProfileState>((set, get) => ({
  ...getInitialDataState(),

  async bootstrap(options) {
    const { isBootstrapping, hasBootstrapped, lastAuthUserId } = get();
    const { accessToken, userId } = requireAuthContext();

    if (isBootstrapping) {
      return;
    }

    if (!options?.force && hasBootstrapped && lastAuthUserId === userId) {
      return;
    }

    set({
      ...getInitialDataState(),
      isBootstrapping: true,
      isLoadingOptions: true,
      lastAuthUserId: userId,
    });

    try {
      const [profile, setupOptions] = await Promise.all([
        getMyStudentProfile(accessToken),
        getAcademicSetupOptions(accessToken),
      ]);
      const hydratedSelection = getHydratedSelection(profile);
      let faculties: AcademicOption[] = [];
      let majors: AcademicOption[] = [];
      const subjects: AcademicSubject[] = [];

      if (hydratedSelection.selectedUniversityId) {
        faculties = await listFacultiesForUniversity(
          hydratedSelection.selectedUniversityId,
          accessToken,
        );
      }

      if (hydratedSelection.selectedFacultyId) {
        majors = await listMajorsForFaculty(hydratedSelection.selectedFacultyId, accessToken);
      }

      let facultySubjectsCount = 0;

      if (hydratedSelection.selectedFacultyId) {
        facultySubjectsCount = await countSubjectsForFaculty(
          hydratedSelection.selectedFacultyId,
          accessToken,
        ).catch(() => 0);
      }

      set({
        profile,
        ...setupOptions,
        faculties,
        majors,
        subjects,
        facultySubjectsCount,
        ...hydratedSelection,
        hasBootstrapped: true,
        isBootstrapping: false,
        isLoadingOptions: false,
        errorMessage: null,
      });
    } catch (error) {
      set({
        hasBootstrapped: true,
        isBootstrapping: false,
        isLoadingOptions: false,
        errorMessage: toSafeStudentProfileErrorMessage(error, studentProfileCatalog()),
      });
    }
  },

  async loadBaseAcademicOptions() {
    const { accessToken } = requireAuthContext();

    set({
      isLoadingOptions: true,
      errorMessage: null,
    });

    try {
      const setupOptions = await getAcademicSetupOptions(accessToken);

      set({
        ...setupOptions,
        isLoadingOptions: false,
      });
    } catch (error) {
      set({
        isLoadingOptions: false,
        errorMessage: toSafeStudentProfileErrorMessage(error, studentProfileCatalog()),
      });
    }
  },

  async selectUniversity(universityId) {
    if (universityId === get().selectedUniversityId) {
      return;
    }

    set({
      selectedUniversityId: universityId,
      selectedFacultyId: null,
      selectedMajorId: null,
      faculties: [],
      majors: [],
      subjects: [],
      facultySubjectsCount: 0,
      errorMessage: null,
    });

    if (!universityId) {
      return;
    }

    const { accessToken } = requireAuthContext();

    set({ isLoadingFaculties: true });

    try {
      const faculties = await listFacultiesForUniversity(universityId, accessToken);

      set({
        faculties,
        isLoadingFaculties: false,
      });
    } catch (error) {
      set({
        isLoadingFaculties: false,
        errorMessage: toSafeStudentProfileErrorMessage(error, studentProfileCatalog()),
      });
    }
  },

  async selectFaculty(facultyId) {
    if (facultyId === get().selectedFacultyId) {
      return;
    }

    set({
      selectedFacultyId: facultyId,
      selectedMajorId: null,
      majors: [],
      subjects: [],
      facultySubjectsCount: 0,
      errorMessage: null,
    });

    if (!facultyId) {
      return;
    }

    const { accessToken } = requireAuthContext();

    set({ isLoadingMajors: true, isLoadingSubjects: true });

    try {
      const [majors, facultySubjectsCount] = await Promise.all([
        listMajorsForFaculty(facultyId, accessToken),
        countSubjectsForFaculty(facultyId, accessToken).catch(() => 0),
      ]);

      set({
        majors,
        facultySubjectsCount,
        isLoadingMajors: false,
        isLoadingSubjects: false,
      });
    } catch (error) {
      set({
        isLoadingMajors: false,
        isLoadingSubjects: false,
        errorMessage: toSafeStudentProfileErrorMessage(error, studentProfileCatalog()),
      });
    }
  },

  // The specialization is an optional tag (it starts in year 3); it never restricts which subjects the student sees.
  selectMajor(majorId) {
    set({ selectedMajorId: majorId, errorMessage: null });
    return Promise.resolve();
  },

  selectAcademicYear(academicYearId) {
    set({
      selectedAcademicYearId: academicYearId,
      errorMessage: null,
    });
  },

  selectSemester(semesterId) {
    set({
      selectedSemesterId: semesterId,
      errorMessage: null,
    });
  },

  setStudentNumber(studentNumber) {
    set({
      studentNumber,
      parsedStudentNumber: null,
      parseErrorMessage: null,
      errorMessage: null,
    });
  },

  async parseCurrentStudentNumber() {
    const studentNumber = get().studentNumber.trim();

    if (!studentNumber) {
      set({ parseErrorMessage: studentProfileCatalog().errors.missingStudentNumber });
      return null;
    }

    const { accessToken } = requireAuthContext();

    set({
      isParsingStudentNumber: true,
      parseErrorMessage: null,
    });

    try {
      const parsedStudentNumber = await parseStudentNumber(studentNumber, accessToken);

      set({
        parsedStudentNumber,
        isParsingStudentNumber: false,
      });

      return parsedStudentNumber;
    } catch (error) {
      set({
        isParsingStudentNumber: false,
        parseErrorMessage: toSafeStudentProfileErrorMessage(error, studentProfileCatalog()),
      });

      return null;
    }
  },

  async submitProfile() {
    const profileInput = buildProfileInput(get());

    if (!profileInput) {
      set({ errorMessage: studentProfileCatalog().errors.missingFields });
      throw new Error(studentProfileCatalog().errors.missingFields);
    }

    const { accessToken } = requireAuthContext();

    set({
      isSubmitting: true,
      errorMessage: null,
    });

    try {
      if (!get().parsedStudentNumber) {
        const parsedStudentNumber = await parseStudentNumber(
          profileInput.student_number,
          accessToken,
        );

        set({ parsedStudentNumber });
      }

      const profile = await updateMyStudentProfile(profileInput, accessToken);
      const hydratedSelection = getHydratedSelection(profile);

      set({
        profile,
        ...hydratedSelection,
        hasBootstrapped: true,
        isSubmitting: false,
        errorMessage: null,
      });

      return profile;
    } catch (error) {
      set({
        isSubmitting: false,
        errorMessage: toSafeStudentProfileErrorMessage(error, studentProfileCatalog()),
      });

      throw error;
    }
  },

  clearError() {
    set({
      errorMessage: null,
      parseErrorMessage: null,
    });
  },

  reset() {
    set(getInitialDataState());
  },
}));
