export type Id = string | number;

/** A year or semester as the catalogue returns it: `order` sorts, `name` is shown. */
export type SubjectLevel = { id: Id; name: string; order: number };

/**
 * One subject of the read-only catalogue. It only describes the subject and the student's own state: nothing here can
 * start a join (students reach their groups through an approved subject-registration request).
 */
export type CatalogSubject = {
  id: Id;
  name: string;
  code: string | null;
  academicYear: SubjectLevel | null;
  semester: SubjectLevel | null;
  major: { id: Id; name: string } | null;
  faculty: { id: Id; name: string } | null;
  inCurrentTerm: boolean;
  isEnrolled: boolean;
  hasDescription: boolean;
  /** Only present once `GET subjects/<id>/` has been loaded; the list rows never carry the text. */
  description?: string | null;
};

export type TermFilter = 'current' | 'other' | 'all';

export type SubjectFilters = {
  term: TermFilter;
  /** null = every year. */
  academicYearId: Id | null;
  search: string;
};

export type SubjectSection = {
  key: string;
  semester: SubjectLevel | null;
  /** The semester the university is in now. */
  isCurrent: boolean;
  data: CatalogSubject[];
};

export type SubjectBadge = 'enrolled' | 'currentTerm';
