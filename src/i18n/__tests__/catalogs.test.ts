import { ar } from '../locales/ar';
import { en } from '../locales/en';
import { LOCALES } from '../types';

type Catalog = Record<string, unknown>;

function collectKeys(catalog: Catalog, prefix = ''): string[] {
  return Object.entries(catalog).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return value !== null && typeof value === 'object'
      ? collectKeys(value as Catalog, path)
      : [path];
  });
}

/**
 * The catalog shape is already enforced at compile time by TranslationCatalog. These
 * tests catch what types cannot: a key translated by copying the Arabic text across, and
 * empty strings, both of which type-check but ship untranslated UI.
 */
describe('translation catalogs', () => {
  const arabicKeys = collectKeys(ar);
  const englishKeys = collectKeys(en as unknown as Catalog);

  it('defines exactly the same keys in every locale', () => {
    expect(englishKeys.sort()).toEqual(arabicKeys.sort());
  });

  it('covers every declared locale', () => {
    expect(LOCALES).toEqual(['ar', 'en']);
  });

  it('has no empty strings', () => {
    const readValue = (catalog: Catalog, path: string): unknown =>
      path.split('.').reduce<unknown>((value, key) => (value as Catalog)?.[key], catalog);

    for (const key of arabicKeys) {
      expect(readValue(ar, key)).not.toBe('');
      expect(readValue(en as unknown as Catalog, key)).not.toBe('');
    }
  });

  it('does not leave Arabic text sitting in the English catalog', () => {
    const arabicCharacters = /[؀-ۿ]/u;
    // Language names are intentionally shown in their own script in both catalogs.
    const allowed = new Set(['settings.language.arabic']);

    const untranslated = englishKeys.filter((key) => {
      if (allowed.has(key)) return false;
      const value = key
        .split('.')
        .reduce<unknown>((current, part) => (current as Catalog)?.[part], en as unknown as Catalog);
      return typeof value === 'string' && arabicCharacters.test(value);
    });

    expect(untranslated).toEqual([]);
  });
});
