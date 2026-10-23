jest.mock('expo-secure-store', () => ({ getItem: () => null, setItem: jest.fn() }));

import { contrastRatio } from '../contrast';
import { buildFacultyPalettes, resolveFacultyThemeKey } from '../facultyTheme';

describe('faculty theme resolution', () => {
  it.each([
    ['كلية البناء والتشييد', 'construction'],
    ['كلية الهندسة المدنية', 'construction'],
    ['كلية إدارة الأعمال', 'business'],
    ['كلية هندسة المعلوماتية', 'informatics'],
    ['كلية هندسة البترول', 'petroleum'],
    ['كلية طب الأسنان', 'dentistry'],
    ['كلية الطب البشري', 'medicine'],
    ['كلية الصيدلة', 'pharmacy'],
  ])('%s -> %s', (name, key) => {
    expect(resolveFacultyThemeKey({ name })).toBe(key);
  });
});

describe('construction faculty palette', () => {
  it.each(['light', 'dark'] as const)('keeps primary text readable in the %s scheme', (scheme) => {
    const palette = buildFacultyPalettes(scheme).construction;
    expect(contrastRatio(palette.onPrimary, palette.primary)).toBeGreaterThanOrEqual(4.5);
    expect(palette.logo).toBeDefined();
  });
});
