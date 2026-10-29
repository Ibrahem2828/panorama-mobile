import { academicService, normalizeApiError } from '../../api';
import type { TermConfirmationRequest } from '../../api/services/academic.service';
import type { CurrentTermResponse, TermSubmitError } from './types';

export function loadCurrentTerm(authToken?: string | null): Promise<CurrentTermResponse> {
  return academicService.getCurrentTerm(authToken);
}

export function confirmTerm(input: TermConfirmationRequest, authToken?: string | null) {
  return academicService.submitTermConfirmation(input, authToken);
}

export function toSubmitError(error: unknown): Exclude<TermSubmitError, null> {
  const code = normalizeApiError(error).code;

  return code === 'NETWORK_ERROR' || code === 'TIMEOUT' ? 'network' : 'generic';
}

/** "Yes, moved up" needs both pickers; "no" sends no year or semester at all. */
export function buildConfirmationRequest(
  promoted: boolean,
  academicYearId: string | number | null,
  semesterId: string | number | null,
): TermConfirmationRequest | null {
  if (!promoted) {
    return { promoted: false, academic_year: null, semester: null };
  }

  if (academicYearId == null || semesterId == null) {
    return null;
  }

  return { promoted: true, academic_year: academicYearId, semester: semesterId };
}
