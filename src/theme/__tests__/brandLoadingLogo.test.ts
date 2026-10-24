jest.mock('expo-secure-store', () => ({ getItem: () => null, setItem: jest.fn() }));
jest.mock('@react-native-async-storage/async-storage', () => {
  const store = new Map<string, string>();

  return {
    __esModule: true,
    default: {
      getItem: jest.fn(async (key: string) => store.get(key) ?? null),
      setItem: jest.fn(async (key: string, value: string) => {
        store.set(key, value);
      }),
    },
  };
});

import AsyncStorage from '@react-native-async-storage/async-storage';

import { useBrandStore } from '../brandStore';
import { buildFacultyPalettes, resolveFacultyThemeKey } from '../facultyTheme';

const palettes = buildFacultyPalettes('light');

describe('the logo shown while loading', () => {
  it('is the main logo until the faculty is known', () => {
    expect(resolveFacultyThemeKey(null)).toBe('default');
    expect(palettes.default.logo).toBeDefined();
  });

  it('is the faculty palette (and so its logo) once the faculty is known', () => {
    const keys = [
      'medicine',
      'dentistry',
      'pharmacy',
      'informatics',
      'petroleum',
      'business',
      'construction',
    ] as const;

    for (const key of keys) {
      expect(palettes[key].key).toBe(key);
      expect(palettes[key].logo).toBeDefined();
    }

    expect(palettes[resolveFacultyThemeKey({ name: 'كلية البناء والتشييد' })]).toBe(
      palettes.construction,
    );
  });
});

describe('remembering the last faculty between launches', () => {
  beforeEach(() => {
    useBrandStore.setState({ key: 'default' });
  });

  it('stores the faculty and restores it on the next cold start', async () => {
    useBrandStore.getState().setKey('dentistry');
    await Promise.resolve();
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('panorama.brand.faculty', 'dentistry');

    useBrandStore.setState({ key: 'default' });
    await useBrandStore.getState().hydrate();

    expect(useBrandStore.getState().key).toBe('dentistry');
  });

  it('ignores a stored value that is not a known faculty', async () => {
    await AsyncStorage.setItem('panorama.brand.faculty', 'nonsense');
    await useBrandStore.getState().hydrate();

    expect(useBrandStore.getState().key).toBe('default');
  });

  it('never overrides a faculty that was already set this session', async () => {
    await AsyncStorage.setItem('panorama.brand.faculty', 'medicine');
    useBrandStore.setState({ key: 'pharmacy' });
    await useBrandStore.getState().hydrate();

    expect(useBrandStore.getState().key).toBe('pharmacy');
  });
});
