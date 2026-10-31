import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

import { endpoints } from '../api/endpoints';

const ROOT = path.resolve(__dirname, '..', '..');
const SRC = path.join(ROOT, 'src');

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

const read = (file: string) => readFileSync(file, 'utf8');
const rel = (file: string) => path.relative(ROOT, file).replace(/\\/gu, '/');
const files = sourceFiles(SRC).map((file) => ({ file: rel(file), text: read(file) }));

function offenders(pattern: RegExp, scope: (file: string) => boolean = () => true): string[] {
  return files.filter((f) => scope(f.file) && pattern.test(f.text)).map((f) => f.file);
}

/**
 * Students join a subject's groups only through an approved subject-registration request. These guards keep every
 * student-facing way of asking to join a group, and every join hint in the subject catalogue, from coming back.
 */
describe('students can no longer request to join a group', () => {
  it('has no join call, join endpoint or available-groups endpoint left', () => {
    expect(Object.keys(endpoints.groups)).not.toEqual(expect.arrayContaining(['join']));
    expect(Object.keys(endpoints.groups)).not.toEqual(expect.arrayContaining(['available']));
    expect(offenders(/groups\/\$\{[^}]*\}\/join\/|groups\/available/u)).toEqual([]);
  });

  it('has none of the join symbols in the code', () => {
    expect(
      offenders(
        /\b(?:joinGroup|requestJoinGroup|listAvailableGroups|loadAvailableGroups|loadMoreAvailableGroups|optimisticJoinStatus|canRequestJoin|GroupJoinResult|AvailableGroupsScreen|AvailableGroupsParams|AvailableGroupsQuery)\b/u,
      ),
    ).toEqual([]);
  });

  it('has no available-groups route', () => {
    expect(offenders(/\bAvailableGroups\b/u)).toEqual([]);
  });

  it('keeps the screen file deleted', () => {
    expect(files.map((f) => f.file)).not.toContain(
      'src/features/groups/screens/AvailableGroupsScreen.tsx',
    );
  });

  it('keeps leaving a group', () => {
    expect(read(path.join(SRC, 'api/services/groups.service.ts'))).toContain(
      'export function leaveGroup',
    );
  });
});

describe('the subject catalogue is read-only', () => {
  const inSubjects = (file: string) => file.startsWith('src/features/subjects/');

  it('never links to the registration flow, the groups tab or a join', () => {
    expect(
      offenders(
        /Enrollment|enrollmentService|GroupsRoutes\.Enrollment|requestJoin|joinGroup|\/join\//u,
        inSubjects,
      ),
    ).toEqual([]);
  });

  it('only issues GET requests', () => {
    expect(offenders(/apiClient\.(?:post|put|patch|delete)/u, inSubjects)).toEqual([]);
    const service = read(path.join(SRC, 'api/services/academic.service.ts'));
    const catalogue = service.slice(
      service.indexOf('export function listSubjectCatalog'),
      service.indexOf('export function listUniversities'),
    );

    expect(catalogue).toMatch(/apiClient\.get/u);
    expect(catalogue).not.toMatch(/apiClient\.(?:post|put|patch|delete)/u);
  });

  it('has no join / register / request wording in its screens', () => {
    const wording = /سجّل في|سجّل موادك|طلب الانضمام|انضم|Request to join|Register/u;

    expect(offenders(wording, inSubjects)).toEqual([]);

    const catalog = read(path.join(SRC, 'i18n/locales/ar.ts'));
    const subjectsBlock = catalog.slice(
      catalog.indexOf('\n  subjects: {'),
      catalog.indexOf('\n  lectures: {'),
    );

    expect(subjectsBlock.length).toBeGreaterThan(500);
    expect(subjectsBlock).not.toMatch(
      /انضم|الانضمام|سجّل في|سجّل موادك|تسجيل المواد|طلب تسجيل|طلب الانضمام/u,
    );
  });

  it('shows the details of a subject with a description, the empty text and the enrolled status', () => {
    const details = read(path.join(SRC, 'features/subjects/screens/SubjectDetailsScreen.tsx'));

    expect(details).toContain('t.subjects.details.noDescription');
    expect(details).toContain('t.subjects.details.enrolledStatus');
    expect(details).toContain('t.subjects.details.descriptionTitle');
  });
});

describe('group screens', () => {
  it('have no join button or dialog', () => {
    expect(
      offenders(/t\.groups\.details\.join|t\.groups\.card\.joinShort|onJoin\b|handleJoin/u),
    ).toEqual([]);
  });

  it('show an empty «مجموعاتي» without a call to join', () => {
    const mine = read(path.join(SRC, 'features/groups/screens/MyGroupsScreen.tsx'));

    expect(mine).not.toMatch(/emptyMine\.action/u);
  });
});
