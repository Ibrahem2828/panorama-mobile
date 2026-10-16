import { useEffect } from 'react';

import { resolveFacultyThemeKey, useBrandStore } from '../../../theme';
import { useAuthStore } from '../../auth/store';
import { useStudentProfileStore } from '../store';

/** Keeps the app palette in step with the signed-in student's faculty (brand default for everyone else). */
export function BrandSync() {
  const status = useAuthStore((state) => state.status);
  const faculty = useStudentProfileStore((state) => state.profile?.faculty);
  const setKey = useBrandStore((state) => state.setKey);

  useEffect(() => {
    if (status === 'unauthenticated') {
      setKey('default');
      return;
    }
    if (status === 'authenticated' && faculty) {
      setKey(resolveFacultyThemeKey(faculty));
    }
  }, [faculty, setKey, status]);

  return null;
}
