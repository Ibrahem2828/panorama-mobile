import type { ImageSourcePropType } from 'react-native';

// colorScheme resolves the scheme before the palettes below are built.
import { isDarkScheme } from './colorScheme';
import { darkPalette, DARK_INK, lightPalette } from './colors';
import { contrastRatio, mixHex } from './contrast';

/**
 * Faculty identity. Every Panorama faculty logo shares the same burgundy + purple infinity mark and
 * differs only by its ribbon colour, so a student's theme keeps the brand and swaps that ribbon colour:
 * medicine green, dentistry sky blue, pharmacy lavender, informatics orange, petroleum amber on navy,
 * business rose, construction teal, and neutral grey for the general / basic-requirement identity.
 */
export type FacultyThemeKey =
  | 'default'
  | 'medicine'
  | 'dentistry'
  | 'pharmacy'
  | 'informatics'
  | 'petroleum'
  | 'business'
  | 'construction';

export type BrandPalette = {
  key: FacultyThemeKey;
  /** Main interactive colour (buttons, active tab, links). Always >= 4.5:1 against white text. */
  primary: string;
  primarySoft: string;
  /** A darker shade of `primary` for gradients and pressed states. */
  deep: string;
  /** Secondary brand colour (the logo purple). */
  secondary: string;
  secondarySoft: string;
  /** Accent (the logo burgundy). */
  accent: string;
  accentSoft: string;
  /** The faculty ribbon gradient used for hero banners. */
  ribbon: readonly [string, string];
  /** Text colour that stays readable on top of `primary`. */
  onPrimary: string;
  logo: ImageSourcePropType;
};

const LOGOS_LIGHT = {
  default: require('../assets/images/brand-logo-full-ar.png') as ImageSourcePropType,
  medicine: require('../assets/faculty/medicine.png') as ImageSourcePropType,
  dentistry: require('../assets/faculty/dentistry.png') as ImageSourcePropType,
  pharmacy: require('../assets/faculty/pharmacy.png') as ImageSourcePropType,
  informatics: require('../assets/faculty/informatics.png') as ImageSourcePropType,
  petroleum: require('../assets/faculty/petroleum.png') as ImageSourcePropType,
  business: require('../assets/faculty/business.png') as ImageSourcePropType,
  construction: require('../assets/faculty/construction.png') as ImageSourcePropType,
};

// Light lettering for dark backgrounds (transparent cut-outs, never boxed).
const LOGOS_DARK = {
  default: require('../assets/images/brand-logo-full-ar-dark.png') as ImageSourcePropType,
  medicine: require('../assets/faculty/medicine-dark.png') as ImageSourcePropType,
  dentistry: require('../assets/faculty/dentistry-dark.png') as ImageSourcePropType,
  pharmacy: require('../assets/faculty/pharmacy-dark.png') as ImageSourcePropType,
  informatics: require('../assets/faculty/informatics-dark.png') as ImageSourcePropType,
  petroleum: require('../assets/faculty/petroleum-dark.png') as ImageSourcePropType,
  business: require('../assets/faculty/business-dark.png') as ImageSourcePropType,
  construction: require('../assets/faculty/construction-dark.png') as ImageSourcePropType,
};

const LOGOS = isDarkScheme ? LOGOS_DARK : LOGOS_LIGHT;

const LOGO_PURPLE = lightPalette.brand.secondary;
const LOGO_BURGUNDY = lightPalette.brand.accent;

function lightenForDark(color: string, minContrastWithInk: number): string {
  let amount = 0.4;
  let result = mixHex(color, '#FFFFFF', amount);
  while (contrastRatio(result, DARK_INK) < minContrastWithInk && amount < 0.95) {
    amount += 0.05;
    result = mixHex(color, '#FFFFFF', amount);
  }
  return result;
}

function lightPaletteFor(
  key: FacultyThemeKey,
  primary: string,
  primarySoft: string,
  ribbon: readonly [string, string],
  overrides: Partial<Pick<BrandPalette, 'secondary' | 'secondarySoft'>> = {},
): BrandPalette {
  return {
    key,
    primary,
    primarySoft,
    deep: mixHex(primary, '#0A0F2C', 0.42),
    secondary: overrides.secondary ?? LOGO_PURPLE,
    secondarySoft: overrides.secondarySoft ?? lightPalette.brand.secondarySoft,
    accent: LOGO_BURGUNDY,
    accentSoft: lightPalette.brand.accentSoft,
    ribbon,
    onPrimary: '#FFFFFF',
    logo: LOGOS[key],
  };
}

/**
 * Dark variant built from the same inputs: a lightened primary that stays readable (links, icons, active
 * tab) on the dark surfaces, a deep tint instead of the pastel soft colour, and dark ink wherever white
 * text would fail contrast on the lightened primary.
 */
function darkPaletteFor(
  key: FacultyThemeKey,
  primary: string,
  _primarySoft: string,
  ribbon: readonly [string, string],
  overrides: Partial<Pick<BrandPalette, 'secondary' | 'secondarySoft'>> = {},
): BrandPalette {
  // >= 6:1 against the dark ink keeps the primary above ~5:1 on the dark surface as well.
  const lightPrimary = key === 'default' ? darkPalette.brand.primary : lightenForDark(primary, 6);
  const secondary = lightenForDark(overrides.secondary ?? LOGO_PURPLE, 4.5);
  return {
    key,
    primary: lightPrimary,
    primarySoft: mixHex(primary, darkPalette.background.surface, 0.8),
    deep: mixHex(primary, '#0A0F2C', 0.2),
    secondary,
    secondarySoft: mixHex(overrides.secondary ?? LOGO_PURPLE, darkPalette.background.surface, 0.8),
    accent: darkPalette.brand.accent,
    accentSoft: darkPalette.brand.accentSoft,
    ribbon: [mixHex(ribbon[0], darkPalette.background.surface, 0.25), ribbon[1]],
    onPrimary:
      contrastRatio('#FFFFFF', lightPrimary) >= 4.5 &&
      contrastRatio('#FFFFFF', lightPrimary) >= contrastRatio(DARK_INK, lightPrimary)
        ? '#FFFFFF'
        : DARK_INK,
    logo: LOGOS[key],
  };
}

const palette = isDarkScheme ? darkPaletteFor : lightPaletteFor;

/** Exposed for tests: both variants regardless of the scheme the app resolved at startup. */
export const paletteBuilders = { light: lightPaletteFor, dark: darkPaletteFor } as const;

const FACULTY_INPUTS: Record<FacultyThemeKey, [string, string, readonly [string, string]]> = {
  default: [lightPalette.brand.primary, lightPalette.brand.primarySoft, ['#9AA3B5', '#3B0CA3']],
  medicine: ['#0B7A4F', '#E2F5EC', ['#8FDCB8', '#047857']],
  dentistry: ['#2563C9', '#E6F0FD', ['#C2E8FB', '#8DB4F5']],
  pharmacy: ['#6A2C94', '#F1E8F8', ['#B488D6', '#3B0CA3']],
  informatics: ['#C2550A', '#FFF0E1', ['#FDCB9C', '#F28C1E']],
  petroleum: ['#1B2F78', '#E8ECFA', ['#FDB05C', '#F77F00']],
  business: ['#C2305F', '#FDE8EF', ['#D8A3B1', '#D13D6D']],
  construction: ['#0B7A75', '#E0F4F2', ['#9BDDD6', '#0E9F96']],
};

/** Test helper: the palette of every faculty for a given scheme. */
export function buildFacultyPalettes(
  scheme: 'light' | 'dark',
): Record<FacultyThemeKey, BrandPalette> {
  const build = paletteBuilders[scheme];
  const keys = Object.keys(FACULTY_INPUTS) as FacultyThemeKey[];
  return Object.fromEntries(keys.map((key) => [key, build(key, ...FACULTY_INPUTS[key])])) as Record<
    FacultyThemeKey,
    BrandPalette
  >;
}

export const facultyPalettes: Record<FacultyThemeKey, BrandPalette> = {
  default: palette('default', ...FACULTY_INPUTS.default),
  medicine: palette('medicine', ...FACULTY_INPUTS.medicine),
  dentistry: palette('dentistry', ...FACULTY_INPUTS.dentistry),
  pharmacy: palette('pharmacy', ...FACULTY_INPUTS.pharmacy),
  informatics: palette('informatics', ...FACULTY_INPUTS.informatics),
  petroleum: palette('petroleum', ...FACULTY_INPUTS.petroleum),
  business: palette('business', ...FACULTY_INPUTS.business),
  construction: palette('construction', ...FACULTY_INPUTS.construction),
};

// Faculty codes follow the first digit of the student number (see the backend student-number rule).
const CODE_TO_KEY: Record<string, FacultyThemeKey> = {
  '1': 'medicine',
  '2': 'dentistry',
  '3': 'pharmacy',
  '4': 'informatics',
  '5': 'petroleum',
  '6': 'business',
};

// Name keywords keep the theme right when a university names or codes faculties differently.
const NAME_RULES: readonly [RegExp, FacultyThemeKey][] = [
  [/بناء|البناء|تشييد|تشيد|إنشاء|انشاء|عمارة|مدني|construct|civil|architect/i, 'construction'],
  [/اسنان|أسنان|dent/i, 'dentistry'],
  [/صيدل|pharm/i, 'pharmacy'],
  [/معلومات|informat|computer|حاسوب|software|برمج/i, 'informatics'],
  [/بترول|نفط|petrol/i, 'petroleum'],
  [/اعمال|أعمال|ادارة|إدارة|business|econom|اقتصاد/i, 'business'],
  [/طب|medic/i, 'medicine'],
];

export type FacultyLike =
  | { name?: string | null; code?: string | number | null }
  | null
  | undefined;

export function resolveFacultyThemeKey(faculty: FacultyLike): FacultyThemeKey {
  if (!faculty) {
    return 'default';
  }

  const name = typeof faculty.name === 'string' ? faculty.name : '';
  for (const [pattern, key] of NAME_RULES) {
    if (pattern.test(name)) {
      return key;
    }
  }

  const code = faculty.code == null ? '' : String(faculty.code).trim();
  return CODE_TO_KEY[code] ?? 'default';
}

export function getFacultyPalette(faculty: FacultyLike): BrandPalette {
  return facultyPalettes[resolveFacultyThemeKey(faculty)];
}
