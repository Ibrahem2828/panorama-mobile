import { create } from 'zustand';

import { useAuthStore } from '../../auth/store';
import {
  getAcademicSetupOptions,
  getMyStudentProfile,
  getStudentProfileAcademicYear,
  getStudentProfileStudentNumber,
  listFacultiesForUniversity,
  listMajorsForFaculty,
  listSubjectsForMajor,
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

const MISSING_SESSION_MESSAGE = 'انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى.';
const MISSING_FIELDS_MESSAGE = 'يرجى إكمال كل حقول الملف الأكاديمي قبل المتابعة.';
const MISSING_STUDENT_NUMBER_MESSAGE = 'يرجى إدخال الرقم الجامعي أولا.';

function getInitialDataState() {
  return {
    profile: null,
    universities: [],
    faculties: [],
    majors: [],
    academicYears: [],
    semesters: [],
    subjects: [],
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
    throw new Error(MISSING_SESSION_MESSAGE);
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
    !state.selectedMajorId ||
    !state.selectedAcademicYearId ||
    !state.selectedSemesterId ||
    !studentNumber
  ) {
    return null;
  }

  return {
    university: state.selectedUniversityId,
    faculty: state.selectedFacultyId,
    major: state.selectedMajorId,
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
      let subjects: AcademicSubject[] = [];

      if (hydratedSelection.selectedUniversityId) {
        faculties = await listFacultiesForUniversity(
          hydratedSelection.selectedUniversityId,
          accessToken,
        );
      }

      if (hydratedSelection.selectedFacultyId) {
        majors = await listMajorsForFaculty(hydratedSelection.selectedFacultyId, accessToken);
      }

      if (hydratedSelection.selectedMajorId) {
        subjects = await listSubjectsForMajor(hydratedSelection.selectedMajorId, accessToken);
      }

      set({
        profile,
        ...setupOptions,
        faculties,
        majors,
        subjects,
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
        errorMessage: toSafeStudentProfileErrorMessage(error),
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
        errorMessage: toSafeStudentProfileErrorMessage(error),
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
        errorMessage: toSafeStudentProfileErrorMessage(error),
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
      errorMessage: null,
    });

    if (!facultyId) {
      return;
    }

    const { accessToken } = requireAuthContext();

    set({ isLoadingMajors: true });

    try {
      const majors = await listMajorsForFaculty(facultyId, accessToken);

      set({
        majors,
        isLoadingMajors: false,
      });
    } catch (error) {
      set({
        isLoadingMajors: false,
        errorMessage: toSafeStudentProfileErrorMessage(error),
      });
    }
  },

  async selectMajor(majorId) {
    if (majorId === get().selectedMajorId) {
      return;
    }

    set({
      selectedMajorId: majorId,
      subjects: [],
      errorMessage: null,
    });

    if (!majorId) {
      return;
    }

    const { accessToken } = requireAuthContext();

    set({ isLoadingSubjects: true });

    try {
      const subjects = await listSubjectsForMajor(majorId, accessToken);

      set({
        subjects,
        isLoadingSubjects: false,
      });
    } catch (error) {
      set({
        isLoadingSubjects: false,
        errorMessage: toSafeStudentProfileErrorMessage(error),
      });
    }
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
      set({ parseErrorMessage: MISSING_STUDENT_NUMBER_MESSAGE });
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
        parseErrorMessage: toSafeStudentProfileErrorMessage(error),
      });

      return null;
    }
  },

  async submitProfile() {
    const profileInput = buildProfileInput(get());

    if (!profileInput) {
      set({ errorMessage: MISSING_FIELDS_MESSAGE });
      throw new Error(MISSING_FIELDS_MESSAGE);
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
        errorMessage: toSafeStudentProfileErrorMessage(error),
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
