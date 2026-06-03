import { apiClient } from '../client';
import { endpoints } from '../endpoints';
import type { ApiListParams, AcademicOption } from '../types';
import type { PaginatedResult } from '../pagination';
import { toPaginationQuery } from '../pagination';

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

export function listSubjectsForMajor(
  majorId: string | number,
  params?: ApiListParams,
  authToken?: string | null,
) {
  return apiClient.get<PaginatedResult<AcademicOption>>(
    endpoints.academic.subjectsForMajor(majorId),
    { authToken, query: toPaginationQuery(params) },
  );
}
