import type { TextStyle } from 'react-native';

const weight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

const variants = {
  display: {
    fontSize: 34,
    lineHeight: 44,
    fontWeight: weight.bold,
  },
  h1: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: weight.bold,
  },
  h2: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: weight.bold,
  },
  h3: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: weight.semibold,
  },
  title: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: weight.semibold,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: weight.medium,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: weight.regular,
  },
  bodySmall: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: weight.regular,
  },
  caption: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: weight.regular,
  },
  button: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: weight.semibold,
  },
  input: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: weight.regular,
  },
  label: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: weight.medium,
  },
} as const satisfies Record<string, TextStyle>;

export const typography = {
  fontFamily: {
    primary: 'Tajawal',
    technicalFallback: 'IBM Plex Sans Arabic',
    headingFallback: 'Cairo',
    system: 'System',
  },
  size: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 22,
    xxl: 28,
    xxxl: 34,
  },
  lineHeight: {
    xs: 18,
    sm: 22,
    md: 24,
    lg: 26,
    xl: 32,
    xxl: 36,
    xxxl: 44,
  },
  weight,
  variants,
} as const;
