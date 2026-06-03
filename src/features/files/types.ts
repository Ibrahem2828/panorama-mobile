export type Id = string | number;

export type FileVisibility =
  | 'public'
  | 'students_only'
  | 'verified_students_only'
  | 'major_only'
  | 'group_only'
  | 'admin_only'
  | string;

export type FileResource = {
  id: Id;
  title?: string;
  name?: string;
  description?: string | null;
  file?: string | null;
  file_url?: string | null;
  url?: string | null;
  download_url?: string | null;
  mime_type?: string | null;
  content_type?: string | null;
  mimeType?: string | null;
  extension?: string | null;
  size?: number | null;
  size_bytes?: number | null;
  sizeBytes?: number | null;
  visibility?: FileVisibility;
  group?: Id | Record<string, unknown> | null;
  major?: Id | Record<string, unknown> | null;
  academic_year?: Id | Record<string, unknown> | null;
  semester?: Id | Record<string, unknown> | null;
  subject?: Id | Record<string, unknown> | null;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
};

export type FileListSource = 'all' | 'group';

export type FileViewerType = 'pdf' | 'image' | 'document' | 'unknown';
