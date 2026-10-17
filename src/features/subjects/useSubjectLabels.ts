import { useMemo } from 'react';

import { useStudentProfileStore } from '../student-profile';
import { getEntityLabel } from './services';

type Option = { id: string | number; name: string };

function labelFor(options: Option[], value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  // The subject list returns bare ids; a nested object already carries its own name.
  if (typeof value === 'object') {
    return getEntityLabel(value);
  }

  return options.find((option) => String(option.id) === String(value))?.name ?? null;
}

/** Resolves the year / semester / specialization ids on a subject to display names (never to raw ids). */
export function useSubjectLabels() {
  const years = useStudentProfileStore((state) => state.academicYears);
  const semesters = useStudentProfileStore((state) => state.semesters);
  const majors = useStudentProfileStore((state) => state.majors);

  return useMemo(
    () => ({
      year: (value: unknown) => labelFor(years, value),
      semester: (value: unknown) => labelFor(semesters, value),
      major: (value: unknown) => labelFor(majors, value),
    }),
    [years, semesters, majors],
  );
}
