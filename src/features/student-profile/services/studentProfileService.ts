import {
  academicService,
  apiClient,
  endpoints,
  normalizeApiError,
  type AcademicOption as ApiAcademicOption,
  type EntityId,
  type PaginatedResult,
  type SubjectRecord,
} from '../../../api';
import type {
  AcademicOption,
  AcademicSetupOptions,
  AcademicSubject,
  ParsedStudentNumber,
  StudentProfile,
  StudentProfileUpdateInput,
} from '../types';

const ACADEMIC_PAGE_SIZE = 500;

const NETWORK_MESSAGE = 'تعذر الاتصال بالخادم. تحقق من اتصال الإنترنت ثم حاول مرة أخرى.';
const VALIDATION_MESSAGE = 'يرجى التأكد من البيانات الأكاديمية المدخلة.';
const UNAUTHORIZED_MESSAGE = 'انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى.';
const GENERIC_MESSAGE = 'تعذر تنفيذ العملية. حاول مرة أخرى.';

type AcademicListItem = ApiAcademicOption | SubjectRecord;
type FlexibleAcademicListResponse = PaginatedResult<AcademicListItem> | AcademicListItem[];

function toText(value: unknown): string | null {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }

  if (typeof value === 'number') {
    return String(value);
  }

  return null;
}

function normalizeAcademicOption(option: AcademicListItem): AcademicOption {
  const name =
    toText(option.name) ??
    toText(option.label) ??
    toText(option.title) ??
    toText(option.display_name) ??
    String(option.id);

  return {
    id: option.id,
    name,
    code: toText(option.code) ?? toText(option.slug),
  };
}

function getAcademicListItems(response: FlexibleAcademicListResponse): AcademicListItem[] {
  if (Array.isArray(response)) {
    return response;
  }

  return response.results;
}

function normalizeAcademicList(response: FlexibleAcademicListResponse): AcademicOption[] {
  return getAcademicListItems(response).map(normalizeAcademicOption);
}

function isNotFound(error: unknown): boolean {
  return normalizeApiError(error).code === 'NOT_FOUND';
}

export function toSafeStudentProfileErrorMessage(error: unknown): string {
  const normalizedError = normalizeApiError(error);

  if (normalizedError.code === 'NETWORK_ERROR' || normalizedError.code === 'TIMEOUT') {
    return NETWORK_MESSAGE;
  }

  if (normalizedError.code === 'UNAUTHORIZED') {
    return UNAUTHORIZED_MESSAGE;
  }

  if (normalizedError.code === 'VALIDATION_ERROR') {
    return VALIDATION_MESSAGE;
  }

  return normalizedError.message || GENERIC_MESSAGE;
}

export async function getAcademicSetupOptions(
  authToken?: string | null,
): Promise<AcademicSetupOptions> {
  const params = { pageSize: ACADEMIC_PAGE_SIZE };
  const [universities, academicYears, semesters] = await Promise.all([
    academicService.listUniversities(params, authToken),
    academicService.listAcademicYears(params, authToken),
    academicService.listSemesters(params, authToken),
  ]);

  return {
    universities: normalizeAcademicList(universities),
    academicYears: normalizeAcademicList(academicYears),
    semesters: normalizeAcademicList(semesters),
  };
}

export async function listFacultiesForUniversity(
  universityId: EntityId,
  authToken?: string | null,
): Promise<AcademicOption[]> {
  const response = await academicService.listFacultiesForUniversity(
    universityId,
    { pageSize: ACADEMIC_PAGE_SIZE },
    authToken,
  );

  return normalizeAcademicList(response);
}

export async function listMajorsForFaculty(
  facultyId: EntityId,
  authToken?: string | null,
): Promise<AcademicOption[]> {
  const response = await academicService.listMajorsForFaculty(
    facultyId,
    { pageSize: ACADEMIC_PAGE_SIZE },
    authToken,
  );

  return normalizeAcademicList(response);
}

export async function listSubjectsForMajor(
  majorId: EntityId,
  authToken?: string | null,
): Promise<AcademicSubject[]> {
  const response = await academicService.listSubjectsForMajor(
    majorId,
    { pageSize: ACADEMIC_PAGE_SIZE },
    authToken,
  );

  return normalizeAcademicList(response);
}

export async function getMyStudentProfile(authToken?: string | null) {
  try {
    return await apiClient.get<StudentProfile>(endpoints.students.profile, {
      authToken,
    });
  } catch (error) {
    if (isNotFound(error)) {
      return null;
    }

    throw error;
  }
}

export function updateMyStudentProfile(
  input: StudentProfileUpdateInput,
  authToken?: string | null,
) {
  return apiClient.patch<StudentProfile, StudentProfileUpdateInput>(
    endpoints.students.profile,
    input,
    { authToken },
  );
}

export function parseStudentNumber(studentNumber: string, authToken?: string | null) {
  return apiClient.get<ParsedStudentNumber>(endpoints.students.parseStudentNumber, {
    authToken,
    query: {
      student_number: studentNumber,
    },
  });
}

export function getStudentProfileAcademicYear(profile: StudentProfile | null) {
  return profile?.academic_year ?? profile?.academicYear ?? null;
}

export function getStudentProfileStudentNumber(profile: StudentProfile | null): string | null {
  return profile?.student_number ?? profile?.studentNumber ?? null;
}

export function getStudentProfileVerificationStatus(profile: StudentProfile | null) {
  return profile?.verification_status ?? 'none';
}

export function isStudentProfileComplete(profile: StudentProfile | null): boolean {
  if (!profile) {
    return false;
  }

  if (profile.is_academic_profile_complete === true || profile.isAcademicProfileComplete === true) {
    return true;
  }

  return Boolean(
    profile.university &&
      profile.faculty &&
      profile.major &&
      getStudentProfileAcademicYear(profile) &&
      profile.semester &&
      getStudentProfileStudentNumber(profile),
  );
}
