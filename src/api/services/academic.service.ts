import { apiClient } from '../client';
import { endpoints } from '../endpoints';
import type {
  AcademicOption,
  ApiListParams,
  CatalogSubjectDetailRecord,
  CatalogSubjectRecord,
  EntityId,
  SubjectRecord,
} from '../types';
import type { PaginatedResult } from '../pagination';
import { toPaginationQuery } from '../pagination';

export type SubjectListParams = ApiListParams & {
  academic_year?: EntityId;
  semester?: EntityId;
};

export type SubjectCatalogParams = ApiListParams & {
  academic_year?: EntityId | null;
  semester?: EntityId | null;
  enrolled?: boolean;
  in_current_term?: boolean;
};

/** The read-only subject catalogue: current-term subjects first, then year, semester and name (server order). */
export function listSubjectCatalog(params?: SubjectCatalogParams, authToken?: string | null) {
  return apiClient.get<PaginatedResult<CatalogSubjectRecord>>(endpoints.academic.subjectCatalog, {
    authToken,
    query: {
      ...toPaginationQuery(params),
      academic_year: params?.academic_year ?? undefined,
      semester: params?.semester ?? undefined,
      enrolled: params?.enrolled,
      in_current_term: params?.in_current_term,
    },
  });
}

export function getSubjectCatalogDetail(subjectId: EntityId, authToken?: string | null) {
  return apiClient.get<CatalogSubjectDetailRecord>(
    endpoints.academic.subjectCatalogDetail(subjectId),
    { authToken },
  );
}

export function listUniversities(params?: ApiListParams, authToken?: string | null) {
  return apiClient.get<PaginatedResult<AcademicOption>>(endpoints.academic.universities, {
    authToken,
    query: toPaginationQuery(params),
  });
}

export function listAcademicYears(params?: ApiListParams, authToken?: string | null) {
  return apiClient.get<PaginatedResult<AcademicOption>>(endpoints.academic.academicYears, {
    authToken,
    query: toPaginationQuery(params),
  });
}

export function listSemesters(params?: ApiListParams, authToken?: string | null) {
  return apiClient.get<PaginatedResult<AcademicOption>>(endpoints.academic.semesters, {
    authToken,
    query: toPaginationQuery(params),
  });
}

export function listFacultiesForUniversity(
  universityId: string | number,
  params?: ApiListParams,
  authToken?: string | null,
) {
  return apiClient.get<PaginatedResult<AcademicOption>>(
    endpoints.academic.facultiesForUniversity(universityId),
    { authToken, query: toPaginationQuery(params) },
  );
}

export function listMajorsForFaculty(
  facultyId: string | number,
  params?: ApiListParams,
  authToken?: string | null,
) {
  return apiClient.get<PaginatedResult<AcademicOption>>(
    endpoints.academic.majorsForFaculty(facultyId),
    { authToken, query: toPaginationQuery(params) },
  );
}

export function listSubjectsForFaculty(
  facultyId: string | number,
  params?: SubjectListParams & { major?: string | number | null },
  authToken?: string | null,
) {
  return apiClient.get<PaginatedResult<SubjectRecord>>(
    endpoints.academic.subjectsForFaculty(facultyId),
    {
      authToken,
      query: {
        ...toPaginationQuery(params),
        academic_year: params?.academic_year,
        semester: params?.semester,
        major: params?.major ?? undefined,
      },
    },
  );
}

export function listSubjectsForMajor(
  majorId: string | number,
  params?: SubjectListParams,
  authToken?: string | null,
) {
  return apiClient.get<PaginatedResult<SubjectRecord>>(
    endpoints.academic.subjectsForMajor(majorId),
    {
      authToken,
      query: {
        ...toPaginationQuery(params),
        academic_year: params?.academic_year,
        semester: params?.semester,
      },
    },
  );
}

export type TermSemester = { id: number; name: string; order: number };

export type CurrentTermResponse = {
  semester: TermSemester;
  other_semester: TermSemester | null;
  term_started_at: string | null;
  term_label: string;
};

export type TermConfirmationRequest = {
  promoted: boolean;
  academic_year: EntityId | null;
  semester: EntityId | null;
};

export function getCurrentTerm(authToken?: string | null) {
  return apiClient.get<CurrentTermResponse>(endpoints.academic.currentTerm, { authToken });
}

/** The student answers "did you move to the next year?". Never cached and never queued: it needs the server. */
export function submitTermConfirmation(input: TermConfirmationRequest, authToken?: string | null) {
  return apiClient.post<unknown, TermConfirmationRequest>(
    endpoints.students.termConfirmation,
    input,
    {
      authToken,
    },
  );
}
