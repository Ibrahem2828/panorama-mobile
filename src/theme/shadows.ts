import type { ViewStyle } from 'react-native';

import { resolvedScheme } from './colorScheme';

const flat: ViewStyle = {
  shadowColor: 'transparent',
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0,
  shadowRadius: 0,
  elevation: 0,
};

const lightShadows = {
  none: flat,
  xs: {
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  card: {
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  floating: {
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 8,
  },
} as const satisfies Record<string, ViewStyle>;

// In dark mode surfaces are separated by borders and tonal elevation; only floating layers keep a
// faint shadow so sheets still lift off the page.
const darkShadows: Record<keyof typeof lightShadows, ViewStyle> = {
  none: flat,
  xs: flat,
  sm: flat,
  md: flat,
  card: flat,
  floating: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
};

export const shadows: Record<keyof typeof lightShadows, ViewStyle> =
  resolvedScheme === 'dark' ? darkShadows : lightShadows;
