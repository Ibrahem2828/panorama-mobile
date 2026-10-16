import type { ImageSourcePropType } from 'react-native';

import { colors } from './colors';

/**
 * Faculty identity. Every Panorama faculty logo shares the same burgundy + purple infinity mark and
 * differs only by its ribbon colour, so a student's theme keeps the brand and swaps that ribbon colour:
 * medicine green, dentistry sky blue, pharmacy lavender, informatics orange, petroleum amber on navy,
 * business rose, and neutral grey for the general / basic-requirement identity.
 */
export type FacultyThemeKey =
  | 'default'
  | 'medicine'
  | 'dentistry'
  | 'pharmacy'
  | 'informatics'
  | 'petroleum'
  | 'business';

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

const LOGOS = {
  default: require('../assets/images/brand-logo-full-ar.png') as ImageSourcePropType,
  medicine: require('../assets/faculty/medicine.png') as ImageSourcePropType,
  dentistry: require('../assets/faculty/dentistry.png') as ImageSourcePropType,
  pharmacy: require('../assets/faculty/pharmacy.png') as ImageSourcePropType,
  informatics: require('../assets/faculty/informatics.png') as ImageSourcePropType,
  petroleum: require('../assets/faculty/petroleum.png') as ImageSourcePropType,
  business: require('../assets/faculty/business.png') as ImageSourcePropType,
};

const LOGO_PURPLE = colors.brand.secondary;
const LOGO_BURGUNDY = colors.brand.accent;

function mixHex(from: string, to: string, amount: number): string {
  const parse = (hex: string): [number, number, number] => [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
  const [r1, g1, b1] = parse(from);
  const [r2, g2, b2] = parse(to);
  const blend = (a: number, b: number) =>
    Math.round(a + (b - a) * amount)
      .toString(16)
      .padStart(2, '0');
  return `#${blend(r1, r2)}${blend(g1, g2)}${blend(b1, b2)}`;
}

function palette(
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
    secondarySoft: overrides.secondarySoft ?? colors.brand.secondarySoft,
    accent: LOGO_BURGUNDY,
    accentSoft: colors.brand.accentSoft,
    ribbon,
    onPrimary: '#FFFFFF',
    logo: LOGOS[key],
  };
}

export const facultyPalettes: Record<FacultyThemeKey, BrandPalette> = {
  default: palette('default', colors.brand.primary, colors.brand.primarySoft, [
    '#9AA3B5',
    '#3B0CA3',
  ]),
  medicine: palette('medicine', '#0B7A4F', '#E2F5EC', ['#8FDCB8', '#047857']),
  dentistry: palette('dentistry', '#2563C9', '#E6F0FD', ['#C2E8FB', '#8DB4F5']),
  pharmacy: palette('pharmacy', '#6A2C94', '#F1E8F8', ['#B488D6', '#3B0CA3']),
  informatics: palette('informatics', '#C2550A', '#FFF0E1', ['#FDCB9C', '#F28C1E']),
  petroleum: palette('petroleum', '#1B2F78', '#E8ECFA', ['#FDB05C', '#F77F00']),
  business: palette('business', '#C2305F', '#FDE8EF', ['#D8A3B1', '#D13D6D']),
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
