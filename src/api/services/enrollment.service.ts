import { apiClient } from '../client';
import { endpoints } from '../endpoints';
import { uploadFormData, type UploadHandle } from '../upload';

export type EnrollmentSubject = {
  id: number;
  name: string;
  code: string;
  academic_year_name: string;
  semester_name: string;
};

export type EnrollmentItemRecord = {
  id: number;
  subject: EnrollmentSubject;
  status: 'pending' | 'approved' | 'rejected';
  reason: string;
};

export type EnrollmentStatus =
  | 'pending'
  | 'approved'
  | 'partially_approved'
  | 'rejected'
  | 'cancelled';

export type EnrollmentRecord = {
  id: number;
  status: EnrollmentStatus;
  review_note: string;
  items: EnrollmentItemRecord[];
  created_at: string;
  reviewed_at: string | null;
};

/** Type-ahead over the student's faculty; the server refuses to list anything for fewer than two characters. */
export function searchEnrollmentSubjects(query: string, authToken: string) {
  return apiClient.get<EnrollmentSubject[]>(endpoints.enrollment.subjects, {
    authToken,
    query: { q: query },
  });
}

export function listMyEnrollments(authToken: string) {
  return apiClient.get<EnrollmentRecord[]>(endpoints.enrollment.requests, { authToken });
}

/** Sends the Learnata screenshot together with the subject ids (multipart) and reports upload progress. */
export function submitEnrollment(
  input: { screenshot: { uri: string; name: string; type: string }; subjectIds: number[] },
  authToken: string,
  options: { idempotencyKey?: string; onProgress?: (fraction: number) => void } = {},
): UploadHandle<EnrollmentRecord> {
  const form = new FormData();

  form.append('screenshot', {
    uri: input.screenshot.uri,
    name: input.screenshot.name,
    type: input.screenshot.type,
  } as unknown as Blob);
  input.subjectIds.forEach((id) => form.append('subject_ids', String(id)));

  return uploadFormData<EnrollmentRecord>(endpoints.enrollment.requests, form, {
    authToken,
    idempotencyKey: options.idempotencyKey,
    onProgress: options.onProgress,
  });
}

export function cancelEnrollment(id: number, authToken: string) {
  return apiClient.post<EnrollmentRecord, Record<string, never>>(
    endpoints.enrollment.cancel(id),
    {},
    { authToken },
  );
}
