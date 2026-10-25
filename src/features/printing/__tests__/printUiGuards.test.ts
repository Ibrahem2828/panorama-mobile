import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

const root = join(__dirname, '..');

function sources(dir: string): string[] {
  return readdirSync(join(root, dir))
    .filter((name) => name.endsWith('.tsx'))
    .map((name) => readFileSync(join(root, dir, name), 'utf8'));
}

describe('printing UI guards', () => {
  it('never shows raw unit or currency codes (they come from the catalog or formatPrintMoney)', () => {
    const all = [...sources('components'), ...sources('screens')].join('\n');

    expect(all).not.toMatch(/\}\s?g`/u);
    expect(all).not.toMatch(/>\s*(SYP|USD)\s*</u);
  });

  it('groups the options into collapsible sections', () => {
    const options = readFileSync(join(root, 'components', 'PrintItemOptions.tsx'), 'utf8');

    expect(options.match(/<PrintOptionSection/gu)?.length).toBe(3);
  });
});
