export type Id = string | number;

export type Subject = {
  id: Id;
  name?: string;
  title?: string;
  code?: string;
  description?: string | null;
  major?: Id | Record<string, unknown> | null;
  academic_year?: Id | Record<string, unknown> | null;
  semester?: Id | Record<string, unknown> | null;
  order?: number;
  created_at?: string;
  updated_at?: string;
  files_count?: number;
  groups_count?: number;
  lectures_count?: number;
  [key: string]: unknown;
};

export type SubjectFilters = {
  academicYearId?: Id | null;
  semesterId?: Id | null;
  search?: string;
};

export type SubjectListStateSource = 'studentProfile' | 'manual' | 'unknown';
