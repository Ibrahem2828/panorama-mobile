// Imported first on purpose: the palette below is chosen once, at module load, from the resolved scheme.
import { resolvedScheme } from './colorScheme';

type Palette = {
  brand: {
    primary: string;
    primarySoft: string;
    secondary: string;
    secondarySoft: string;
    accent: string;
    accentSoft: string;
  };
  semantic: {
    success: string;
    successSoft: string;
    warning: string;
    warningSoft: string;
    error: string;
    errorSoft: string;
    info: string;
    infoSoft: string;
  };
  background: { primary: string; surface: string; muted: string; elevated: string };
  text: { primary: string; secondary: string; inverse: string; muted: string; disabled: string };
  border: { default: string; strong: string };
  overlay: string;
  ripple: string;
  glass: string;
  disabled: string;
  neutralStatus: string;
  gray: {
    50: string;
    100: string;
    200: string;
    300: string;
    500: string;
    700: string;
    900: string;
  };
};

export const lightPalette: Palette = {
  brand: {
    primary: '#002B7F',
    primarySoft: '#E8EEFF',
    secondary: '#3B0CA3',
    secondarySoft: '#EEE9FF',
    accent: '#A50D46',
    accentSoft: '#FFE8F2',
  },
  semantic: {
    success: '#17A56B',
    successSoft: '#E7F7EF',
    warning: '#F5A524',
    warningSoft: '#FFF7E1',
    error: '#D93025',
    errorSoft: '#FDECEC',
    info: '#2563EB',
    infoSoft: '#EAF1FF',
  },
  background: { primary: '#F8FAFC', surface: '#FFFFFF', muted: '#F2F4F7', elevated: '#FFFFFF' },
  text: {
    primary: '#101828',
    secondary: '#475467',
    inverse: '#FFFFFF',
    muted: '#667085',
    disabled: '#98A2B3',
  },
  border: { default: '#BFC0C2', strong: '#98A2B3' },
  overlay: 'rgba(16, 24, 40, 0.48)',
  ripple: 'rgba(16, 24, 40, 0.08)',
  glass: 'rgba(255, 255, 255, 0.85)',
  disabled: '#D0D5DD',
  neutralStatus: '#667085',
  gray: {
    50: '#F9FAFB',
    100: '#F2F4F7',
    200: '#E4E7EC',
    300: '#D0D5DD',
    500: '#667085',
    700: '#344054',
    900: '#101828',
  },
};

/**
 * Dark palette: deep navy surfaces, borders (not shadows) for elevation, lightened semantic colours
 * that keep >= 4.5:1 on the dark surfaces, and dark tints for the "soft" backgrounds.
 */
export const darkPalette: Palette = {
  brand: {
    primary: '#8FAAF5',
    primarySoft: '#14224D',
    secondary: '#B39DFA',
    secondarySoft: '#241C4F',
    accent: '#F58BB1',
    accentSoft: '#3A1628',
  },
  semantic: {
    success: '#34D399',
    successSoft: '#0F2E24',
    warning: '#FBBF24',
    warningSoft: '#3A2B0C',
    error: '#F87171',
    errorSoft: '#3A1518',
    info: '#7DB0FF',
    infoSoft: '#112445',
  },
  background: { primary: '#0B1020', surface: '#131A2E', muted: '#1E2742', elevated: '#1A2238' },
  text: {
    primary: '#EEF2FF',
    secondary: '#B6C0DC',
    // Text/icons on solid colour fills (lightened in dark mode), so dark ink instead of white.
    inverse: '#0B1020',
    muted: '#8D99B8',
    disabled: '#5F6B8C',
  },
  border: { default: '#2A3556', strong: '#38456B' },
  overlay: 'rgba(0, 0, 0, 0.66)',
  ripple: 'rgba(238, 242, 255, 0.12)',
  glass: 'rgba(19, 26, 46, 0.85)',
  disabled: '#2A3556',
  neutralStatus: '#8D99B8',
  gray: {
    50: '#131A2E',
    100: '#1A2238',
    200: '#2A3556',
    300: '#38456B',
    500: '#8D99B8',
    700: '#B6C0DC',
    900: '#EEF2FF',
  },
};

const p = resolvedScheme === 'dark' ? darkPalette : lightPalette;
const { brand, semantic } = p;

export const colors = {
  brand,
  background: p.background,
  text: p.text,
  border: {
    default: p.border.default,
    strong: p.border.strong,
    focus: brand.secondary,
  },
  semantic,
  overlay: p.overlay,
  ripple: p.ripple,
  glass: p.glass,
  disabled: p.disabled,
  status: {
    active: semantic.success,
    pending: semantic.warning,
    blocked: semantic.error,
    neutral: p.neutralStatus,
  },
  gray: p.gray,
  primary: brand.primary,
  secondary: brand.secondary,
  accent: brand.accent,
  backgroundPrimary: p.background.primary,
  surface: p.background.surface,
  textPrimary: p.text.primary,
  textSecondary: p.text.muted,
  borderDefault: p.border.default,
  borderStrong: p.border.strong,
  success: semantic.success,
  warning: semantic.warning,
  error: semantic.error,
  info: semantic.info,
  gray50: p.gray[50],
  gray100: p.gray[100],
  gray700: p.gray[700],
} as const;

/** Ink for text/icons that sit on a light-on-dark "primary" fill. */
export const DARK_INK = '#0B1020';
