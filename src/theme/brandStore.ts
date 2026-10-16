import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMemo } from 'react';
import { create } from 'zustand';

import { facultyPalettes, type BrandPalette, type FacultyThemeKey } from './facultyTheme';

const STORAGE_KEY = 'panorama.brand.faculty';

type BrandState = {
  key: FacultyThemeKey;
  setKey: (key: FacultyThemeKey) => void;
  hydrate: () => Promise<void>;
};

function isThemeKey(value: unknown): value is FacultyThemeKey {
  return typeof value === 'string' && value in facultyPalettes;
}

export const useBrandStore = create<BrandState>((set, get) => ({
  key: 'default',
  setKey(key) {
    if (get().key === key) {
      return;
    }
    set({ key });
    AsyncStorage.setItem(STORAGE_KEY, key).catch(() => undefined);
  },
  async hydrate() {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (isThemeKey(stored) && get().key === 'default') {
        set({ key: stored });
      }
    } catch {
      // Theme persistence is a nicety; the default palette is always safe.
    }
  },
}));

/** The student's faculty palette (brand default for staff, guests and unknown faculties). */
export function useBrand(): BrandPalette {
  const key = useBrandStore((state) => state.key);
  return useMemo(() => facultyPalettes[key], [key]);
}
