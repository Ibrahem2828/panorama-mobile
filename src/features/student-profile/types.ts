import type { EntityId, VerificationStatus } from '../../api';

export type AcademicOption = {
  id: EntityId;
  name: string;
  code?: string | number | null;
};

export type AcademicSubject = AcademicOption;

export type AcademicSetupOptions = {
  universities: AcademicOption[];
  academicYears: AcademicOption[];
  semesters: AcademicOption[];
};

export type StudentProfileVerificationStatus = VerificationStatus | string;

export type StudentProfile = {
  id?: EntityId;
  university?: AcademicOption | null;
  faculty?: AcademicOption | null;
  major?: AcademicOption | null;
  academic_year?: AcademicOption | null;
  academicYear?: AcademicOption | null;
  semester?: AcademicOption | null;
  student_number?: string | null;
  studentNumber?: string | null;
  verification_status?: StudentProfileVerificationStatus | null;
  is_academic_profile_complete?: boolean;
  isAcademicProfileComplete?: boolean;
};

export type StudentProfileUpdateInput = {
  university: EntityId;
  faculty: EntityId;
  major: EntityId;
  academic_year: EntityId;
  semester: EntityId;
  student_number: string;
};

export type ParsedStudentNumber = {
  student_number?: string | null;
  studentNumber?: string | null;
  university_code?: string | number | null;
  universityCode?: string | number | null;
  faculty_code?: string | number | null;
  facultyCode?: string | number | null;
  year_code?: string | number | null;
  yearCode?: string | number | null;
  sequence_number?: string | number | null;
  sequenceNumber?: string | number | null;
  university?: AcademicOption | string | number | null;
  faculty?: AcademicOption | string | number | null;
  academic_year?: AcademicOption | string | number | null;
  academicYear?: AcademicOption | string | number | null;
  semester?: AcademicOption | string | number | null;
  major?: AcademicOption | string | number | null;
};

export type StudentProfileBootstrapOptions = {
  force?: boolean;
};
