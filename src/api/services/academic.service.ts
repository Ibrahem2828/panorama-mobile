import { apiClient } from '../client';
import { endpoints } from '../endpoints';
import type { ApiListParams, AcademicOption } from '../types';
import type { PaginatedResult } from '../pagination';
import { toPaginationQuery } from '../pagination';

export function listUniversities(params?: ApiListParams) {
  return apiClient.get<PaginatedResult<AcademicOption>>(endpoints.academic.universities, {
    query: toPaginationQuery(params),
  });
}

export function listAcademicYears(params?: ApiListParams) {
  return apiClient.get<PaginatedResult<AcademicOption>>(endpoints.academic.academicYears, {
    query: toPaginationQuery(params),
  });
}

export function listSemesters(params?: ApiListParams) {
  return apiClient.get<PaginatedResult<AcademicOption>>(endpoints.academic.semesters, {
    query: toPaginationQuery(params),
  });
}

export function listFacultiesForUniversity(universityId: string | number, params?: ApiListParams) {
  return apiClient.get<PaginatedResult<AcademicOption>>(
    endpoints.academic.facultiesForUniversity(universityId),
    { query: toPaginationQuery(params) },
  );
}

export function listMajorsForFaculty(facultyId: string | number, params?: ApiListParams) {
  return apiClient.get<PaginatedResult<AcademicOption>>(
    endpoints.academic.majorsForFaculty(facultyId),
    { query: toPaginationQuery(params) },
  );
}

export function listSubjectsForMajor(majorId: string | number, params?: ApiListParams) {
  return apiClient.get<PaginatedResult<AcademicOption>>(
    endpoints.academic.subjectsForMajor(majorId),
    { query: toPaginationQuery(params) },
  );
}
