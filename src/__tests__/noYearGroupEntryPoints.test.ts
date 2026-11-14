import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const SRC = path.resolve(__dirname, '..');

function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);

    if (statSync(full).isDirectory()) {
      if (name !== '__tests__') sourceFiles(full, out);
    } else if (/\.(ts|tsx)$/u.test(name)) {
      out.push(full);
    }
  }

  return out;
}

/**
 * The backend hides subject-less year/major/semester groups from students and puts every verified student in the
 * community group itself. The Groups tab therefore has no year-group picker and no way to join by hand, and it only
 * ever lists what the server returns (so a group that disappears simply disappears).
 */
describe('groups: no year-group entry points', () => {
  const groupFiles = sourceFiles(path.join(SRC, 'features', 'groups')).map((file) => ({
    file: path.relative(SRC, file).replace(/\\/gu, '/'),
    text: readFileSync(file, 'utf8'),
  }));

  it('has no year, major or semester group selection in the groups feature', () => {
    const offenders = groupFiles
      .filter((f) =>
        /year[_-]?group|major[_-]?group|semester[_-]?group|selectYear|pickYear/iu.test(f.text),
      )
      .map((f) => f.file);

    expect(offenders).toEqual([]);
  });

  it('has no manual join of the community group', () => {
    const offenders = groupFiles
      .filter((f) => /community[_-]?(?:group)?[\s\S]{0,40}\bjoin/iu.test(f.text))
      .map((f) => f.file);

    expect(offenders).toEqual([]);
  });
});
