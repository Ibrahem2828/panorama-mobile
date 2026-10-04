import type { ar } from './locales/ar';

export const LOCALES = ['ar', 'en'] as const;

export type Locale = (typeof LOCALES)[number];

/**
 * Widens the literal types produced by `as const` so another catalog can satisfy the
 * shape without having to repeat Arabic text. Functions are preserved exactly, which is
 * what makes a parameterised entry keep the same signature in every locale.
 */
type Widen<T> = T extends (...args: infer A) => string
  ? (...args: A) => string
  : T extends string
    ? string
    : { [K in keyof T]: Widen<T[K]> };

/**
 * Arabic is the source catalog. Adding a key there turns every other locale into a type
 * error until it is translated, so an untranslated string cannot reach a build.
 */
export type TranslationCatalog = Widen<typeof ar>;
