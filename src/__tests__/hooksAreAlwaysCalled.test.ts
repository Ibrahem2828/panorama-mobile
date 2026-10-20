import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

/**
 * A hook that sits on the right of `||`, `&&`, `??` or in a ternary branch is skipped on some renders, so React sees a
 * different number of hooks and crashes ("Rendered fewer hooks than expected"). This is what broke the student login.
 * The ESLint setup has no rules-of-hooks plugin, so the rule is enforced here.
 */
const SOURCE_ROOT = path.resolve(__dirname, '..');
const CONDITIONAL_HOOK = /(\|\||&&|\?\?|\?)\s*use[A-Z]\w*\(/;

function sourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const full = path.join(directory, name);

    if (statSync(full).isDirectory()) {
      return name === '__tests__' || name === 'node_modules' ? [] : sourceFiles(full);
    }

    return /\.(ts|tsx)$/.test(name) ? [full] : [];
  });
}

describe('hooks', () => {
  it('are never called conditionally through a logical or ternary operator', () => {
    const offenders = sourceFiles(SOURCE_ROOT).flatMap((file) => {
      const text = readFileSync(file, 'utf8');

      return text
        .split(/\r?\n/)
        .map((line, index) => ({ line, number: index + 1 }))
        .filter(({ line }) => !line.trim().startsWith('//') && !line.trim().startsWith('*'))
        .filter(({ line }) => CONDITIONAL_HOOK.test(line))
        .map(({ number }) => `${path.relative(SOURCE_ROOT, file)}:${number}`);
    });

    expect(offenders).toEqual([]);
  });

  it('would catch the pattern that crashed the login', () => {
    expect(CONDITIONAL_HOOK.test('const a = useA((s) => s.x) || useB((s) => s.y);')).toBe(true);
    expect(CONDITIONAL_HOOK.test('const a = useA((s) => s.x);\nconst b = useB((s) => s.y);')).toBe(
      false,
    );
  });
});
