import type {
  CatalogSubject,
  Id,
  SubjectBadge,
  SubjectFilters,
  SubjectLevel,
  SubjectSection,
  TermFilter,
} from '../types';

type Rec = Record<string, unknown>;

function isRecord(value: unknown): value is Rec {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function text(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return null;
}

function toId(value: unknown): Id | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && /^\d+$/u.test(value.trim())) return value.trim();
  return null;
}

function toLevel(value: unknown): SubjectLevel | null {
  if (!isRecord(value)) return null;
  const id = toId(value.id);
  const name = text(value.name);
  if (id === null || !name) return null;
  const order = typeof value.order === 'number' && Number.isFinite(value.order) ? value.order : 0;
  return { id, name, order };
}

function toNamed(value: unknown): { id: Id; name: string } | null {
  if (!isRecord(value)) return null;
  const id = toId(value.id);
  const name = text(value.name);
  return id === null || !name ? null : { id, name };
}

/** Defensive parse of one catalogue row. A row without an id or a name is dropped. */
export function normalizeCatalogSubject(raw: unknown): CatalogSubject | null {
  if (!isRecord(raw)) return null;
  const id = toId(raw.id);
  const name = text(raw.name) ?? text(raw.title);
  if (id === null || !name) return null;

  return {
    id,
    name,
    code: text(raw.code),
    academicYear: toLevel(raw.academic_year),
    semester: toLevel(raw.semester),
    major: toNamed(raw.major),
    faculty: toNamed(raw.faculty),
    inCurrentTerm: raw.in_current_term === true,
    isEnrolled: raw.is_enrolled === true,
    hasDescription: raw.has_description === true,
  };
}

/** The details payload: the row plus the full description, where an empty text is `null` (never an empty string). */
export function normalizeCatalogDetail(raw: unknown): CatalogSubject | null {
  const row = normalizeCatalogSubject(raw);
  if (!row || !isRecord(raw)) return row;
  const description = text(raw.description);

  return { ...row, description, hasDescription: description !== null || row.hasDescription };
}

export function sameId(left: Id | null | undefined, right: Id | null | undefined): boolean {
  return left != null && right != null && String(left) === String(right);
}

type LevelWords = { academicYear: (name: string) => string; semester: (name: string) => string };

const YEAR_WORD = /^\s*(?:ال)?سنة|^\s*year\b/iu;
const SEMESTER_WORD = /^\s*(?:ال)?فصل|^\s*semester\b|^\s*term\b/iu;

/** The year name with its word in front; a name that already says it (for example «السنة الثالثة») is kept as is. */
export function formatYearName(name: string, words: LevelWords): string {
  return YEAR_WORD.test(name) ? name : words.academicYear(name);
}

/** The semester name with its word in front; a name that already says it (for example «الفصل الأول») is kept. */
export function formatSemesterName(name: string, words: LevelWords): string {
  return SEMESTER_WORD.test(name) ? name : words.semester(name);
}

/** The chip on a subject card: «السنة الثالثة · الفصل الأول» (whichever parts are known). */
export function formatLevelChip(subject: CatalogSubject, words: LevelWords): string | null {
  const parts = [
    subject.academicYear ? formatYearName(subject.academicYear.name, words) : null,
    subject.semester ? formatSemesterName(subject.semester.name, words) : null,
  ].filter((part): part is string => part !== null);

  return parts.length > 0 ? parts.join(' · ') : null;
}

/** Badges of a card, in display order: the student's own state first. */
export function getSubjectBadges(subject: CatalogSubject): SubjectBadge[] {
  const badges: SubjectBadge[] = [];
  if (subject.isEnrolled) badges.push('enrolled');
  if (subject.inCurrentTerm) badges.push('currentTerm');
  return badges;
}

export function matchesTermFilter(subject: CatalogSubject, term: TermFilter): boolean {
  if (term === 'current') return subject.inCurrentTerm;
  if (term === 'other') return !subject.inCurrentTerm;
  return true;
}

export function matchesSearch(subject: CatalogSubject, search: string): boolean {
  const needle = search.trim().toLocaleLowerCase();
  if (!needle) return true;

  return [subject.name, subject.code]
    .filter((value): value is string => Boolean(value))
    .join(' ')
    .toLocaleLowerCase()
    .includes(needle);
}

/** Term, year and search together; the order the server sent is kept. */
export function filterSubjects(
  subjects: readonly CatalogSubject[],
  filters: SubjectFilters,
): CatalogSubject[] {
  return subjects.filter(
    (subject) =>
      matchesTermFilter(subject, filters.term) &&
      (filters.academicYearId === null ||
        sameId(subject.academicYear?.id, filters.academicYearId)) &&
      matchesSearch(subject, filters.search),
  );
}

/** The years present in the catalogue, in study order (for the year filter). */
export function collectYears(subjects: readonly CatalogSubject[]): SubjectLevel[] {
  const byId = new Map<string, SubjectLevel>();
  for (const subject of subjects) {
    if (subject.academicYear) byId.set(String(subject.academicYear.id), subject.academicYear);
  }

  return [...byId.values()].sort(
    (a, b) => a.order - b.order || String(a.id).localeCompare(String(b.id)),
  );
}

/**
 * Groups subjects under their semester. The semester the university is in now comes first (when the term is unknown,
 * the semester that holds current-term subjects does), then the others by `order`; subjects with no semester go last.
 * Inside a section the server's order (year, then name) is kept.
 */
export function buildSemesterSections(
  subjects: readonly CatalogSubject[],
  currentSemesterId?: Id | null,
): SubjectSection[] {
  const sections = new Map<string, SubjectSection>();

  for (const subject of subjects) {
    const key = subject.semester ? String(subject.semester.id) : 'none';
    let section = sections.get(key);
    if (!section) {
      section = { key, semester: subject.semester, isCurrent: false, data: [] };
      sections.set(key, section);
    }
    section.data.push(subject);
  }

  for (const section of sections.values()) {
    section.isCurrent =
      section.semester !== null &&
      (currentSemesterId != null
        ? sameId(section.semester.id, currentSemesterId)
        : section.data.some((subject) => subject.inCurrentTerm));
  }

  return [...sections.values()].sort((a, b) => {
    if (a.isCurrent !== b.isCurrent) return a.isCurrent ? -1 : 1;
    if (!a.semester || !b.semester) return a.semester ? -1 : b.semester ? 1 : 0;
    return a.semester.order - b.semester.order;
  });
}
