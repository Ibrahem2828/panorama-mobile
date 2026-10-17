jest.mock('expo-secure-store', () => ({ getItem: () => null, setItem: jest.fn() }));

import { darkPalette, lightPalette } from '../colors';
import { contrastRatio } from '../contrast';
import { buildFacultyPalettes } from '../facultyTheme';

const AA = 4.5;

describe('dark palette contrast (WCAG AA)', () => {
  const surfaces = [
    darkPalette.background.primary,
    darkPalette.background.surface,
    darkPalette.background.elevated,
  ];

  it.each(surfaces)('text.primary and text.secondary are AA on %s', (surface) => {
    expect(contrastRatio(darkPalette.text.primary, surface)).toBeGreaterThanOrEqual(AA);
    expect(contrastRatio(darkPalette.text.secondary, surface)).toBeGreaterThanOrEqual(AA);
  });

  it('muted text stays AA on page, surface and elevated backgrounds', () => {
    for (const surface of surfaces) {
      expect(contrastRatio(darkPalette.text.muted, surface)).toBeGreaterThanOrEqual(AA);
    }
  });

  it('semantic colours are AA on their soft tint and on the surface', () => {
    const s = darkPalette.semantic;
    const pairs: [string, string][] = [
      [s.success, s.successSoft],
      [s.warning, s.warningSoft],
      [s.error, s.errorSoft],
      [s.info, s.infoSoft],
      [s.success, darkPalette.background.surface],
      [s.warning, darkPalette.background.surface],
      [s.error, darkPalette.background.surface],
      [s.info, darkPalette.background.surface],
    ];
    for (const [fg, bg] of pairs) {
      expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(AA);
    }
  });

  it('light palette primary text is still AA', () => {
    expect(
      contrastRatio(lightPalette.text.primary, lightPalette.background.surface),
    ).toBeGreaterThanOrEqual(AA);
  });
});

describe('faculty dark palettes', () => {
  const dark = buildFacultyPalettes('dark');

  it.each(Object.keys(dark))(
    '%s: onPrimary is AA on primary and primary is readable on dark surfaces',
    (key) => {
      const p = dark[key as keyof typeof dark];
      expect(contrastRatio(p.onPrimary, p.primary)).toBeGreaterThanOrEqual(AA);
      expect(contrastRatio(p.primary, darkPalette.background.surface)).toBeGreaterThanOrEqual(AA);
      expect(contrastRatio(p.primary, p.primarySoft)).toBeGreaterThanOrEqual(AA);
    },
  );
});
