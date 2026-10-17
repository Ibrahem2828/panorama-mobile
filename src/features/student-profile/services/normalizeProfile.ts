import type { StudentProfile } from '../types';

const PROFILE_RELATIONS = ['university', 'faculty', 'major', 'academic_year', 'semester'] as const;

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * The API answers with a bare id plus a `<field>_detail` object (e.g. `faculty: 8`,
 * `faculty_detail: { id, name, code }`), while the app reads `profile.faculty.name`. Fold the
 * detail objects into the main fields so every consumer sees `{ id, name, code }` (or null).
 */
export function normalizeStudentProfile<T extends object>(raw: T): StudentProfile {
  const source = raw as Record<string, unknown>;
  const result: Record<string, unknown> = { ...source };

  for (const key of PROFILE_RELATIONS) {
    const detail = source[`${key}_detail`];
    const value = source[key];

    if (isPlainRecord(detail) && detail.id != null) {
      result[key] = detail;
    } else if (typeof value === 'number' || typeof value === 'string') {
      result[key] = { id: value, name: '' };
    } else if (!isPlainRecord(value)) {
      result[key] = null;
    }
  }

  return result as StudentProfile;
}
