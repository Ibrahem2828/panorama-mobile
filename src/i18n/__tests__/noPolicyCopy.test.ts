import { ar } from '../locales/ar';
import { en } from '../locales/en';

type Catalog = Record<string, unknown>;

function collectStrings(catalog: Catalog, prefix = ''): [string, string][] {
  return Object.entries(catalog).flatMap(([key, value]): [string, string][] => {
    const path = prefix ? `${prefix}.${key}` : key;

    if (typeof value === 'string') return [[path, value]];
    if (typeof value === 'function') {
      try {
        return [[path, String((value as (...args: unknown[]) => unknown)(1, 1, 1))]];
      } catch {
        return [];
      }
    }

    return value !== null && typeof value === 'object'
      ? collectStrings(value as Catalog, path)
      : [];
  });
}

// Text shown to students must never announce how content is protected or what the app forbids. The protections
// themselves stay on, silently. Password-protected PDFs (a user-facing technical error) and the legal pages are fine.
const BANNED: RegExp[] = [
  /مشفّ|مشفر|تشفير|تشفّر/u,
  /لا يمكن (حفظ|تنزيل|مشاركة|فتح)/u,
  /(تنزيلها|تنزيله|مشاركتها|مشاركته|حفظها|حفظه) (أو|و)/u,
  /لقطات الشاشة|لقطة الشاشة/u,
  /محتوى محمي|ملفات محمية|صفحات محمية|الملفات محمية|لحماية المحتوى/u,
  /داخل (التطبيق|بانوراما) فقط/u,
  /encrypt/iu,
  /cannot be (downloaded|shared|saved|opened elsewhere)/iu,
  /screenshots? (may|can|are)/iu,
  /protected (content|pages|files)|to protect the content/iu,
  /(inside|within) (the app|panorama) only/iu,
];

describe('student-facing copy', () => {
  for (const [name, catalog] of [
    ['ar', ar],
    ['en', en],
  ] as const) {
    it(`${name} never reveals the content-protection policy`, () => {
      const offenders = collectStrings(catalog as unknown as Catalog).filter(
        ([path, text]) =>
          !path.startsWith('legal.') &&
          !path.startsWith('notifications.') &&
          BANNED.some((pattern) => pattern.test(text)),
      );

      expect(offenders).toEqual([]);
    });
  }
});
