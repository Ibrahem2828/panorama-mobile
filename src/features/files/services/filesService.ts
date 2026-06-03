import { env } from '../../../config/env';
import {
  filesService as apiFilesService,
  normalizeApiError,
  type FileRecord,
  type PaginatedResult,
} from '../../../api';
import type { FileResource, FileViewerType, Id } from '../types';

const NETWORK_MESSAGE = 'تعذر تحميل الملفات. تحقق من اتصال الإنترنت وحاول مرة أخرى.';
const UNAUTHORIZED_MESSAGE = 'انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى.';
const PERMISSION_MESSAGE = 'لا تملك صلاحية الوصول إلى هذه الملفات حاليا.';
const GENERIC_MESSAGE = 'تعذر تحميل الملفات. حاول مرة أخرى.';

const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp']);
const DOCUMENT_EXTENSIONS = new Set(['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt', 'rtf']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toText(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }

  if (typeof value === 'number') {
    return String(value);
  }

  return undefined;
}

function toNullableText(value: unknown): string | null {
  return toText(value) ?? null;
}

function toNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function toRelation(value: unknown): Id | Record<string, unknown> | null {
  if (typeof value === 'string' || typeof value === 'number' || isRecord(value)) {
    return value;
  }

  return null;
}

function toAbsoluteViewUri(value: string): string | null {
  if (/^https?:\/\//u.test(value)) {
    return value;
  }

  if (value.startsWith('/')) {
    return `${env.apiBaseUrl.replace(/\/$/u, '')}${value}`;
  }

  return null;
}

function normalizeFile(record: FileRecord): FileResource {
  return {
    ...record,
    id: record.id,
    title: toText(record.title),
    name: toText(record.name),
    description: toNullableText(record.description),
    file: toNullableText(record.file),
    file_url: toNullableText(record.file_url),
    url: toNullableText(record.url),
    download_url: toNullableText(record.download_url),
    mime_type: toNullableText(record.mime_type),
    content_type: toNullableText(record.content_type),
    mimeType: toNullableText(record.mimeType),
    extension: toNullableText(record.extension),
    size: toNumber(record.size),
    size_bytes: toNumber(record.size_bytes),
    sizeBytes: toNumber(record.sizeBytes),
    visibility: toText(record.visibility),
    group: toRelation(record.group),
    major: toRelation(record.major),
    academic_year: toRelation(record.academic_year),
    semester: toRelation(record.semester),
    subject: toRelation(record.subject),
    created_at: toText(record.created_at),
    updated_at: toText(record.updated_at),
  };
}

function normalizeFileList(response: PaginatedResult<FileRecord>): PaginatedResult<FileResource> {
  return {
    ...response,
    results: response.results.map(normalizeFile),
  };
}

export function getFileDisplayTitle(file: FileResource): string {
  return toText(file.title) ?? toText(file.name) ?? 'ملف بدون عنوان';
}

export function getFileDescription(file: FileResource): string | null {
  return toText(file.description) ?? null;
}

export function getFileUri(file: FileResource): string | null {
  const candidate = toText(file.file_url) ?? toText(file.file) ?? toText(file.url);

  return candidate ? toAbsoluteViewUri(candidate) : null;
}

function getMimeType(file: FileResource): string | null {
  return (
    toText(file.mime_type)?.toLowerCase() ??
    toText(file.content_type)?.toLowerCase() ??
    toText(file.mimeType)?.toLowerCase() ??
    null
  );
}

export function getFileExtension(file: FileResource): string | null {
  const explicitExtension = toText(file.extension)?.replace(/^\./u, '').toLowerCase();

  if (explicitExtension) {
    return explicitExtension;
  }

  const uri = getFileUri(file);

  if (!uri) {
    return null;
  }

  const pathWithoutQuery = uri.split('?')[0]?.split('#')[0] ?? '';
  const match = pathWithoutQuery.match(/\.([a-zA-Z0-9]+)$/u);

  return match?.[1]?.toLowerCase() ?? null;
}

export function getFileViewerType(file: FileResource): FileViewerType {
  const mimeType = getMimeType(file);
  const extension = getFileExtension(file);

  if (mimeType === 'application/pdf' || extension === 'pdf') {
    return 'pdf';
  }

  if (mimeType?.startsWith('image/') || (extension && IMAGE_EXTENSIONS.has(extension))) {
    return 'image';
  }

  if (
    mimeType?.includes('document') ||
    mimeType?.includes('presentation') ||
    mimeType?.includes('spreadsheet') ||
    mimeType === 'text/plain' ||
    (extension && DOCUMENT_EXTENSIONS.has(extension))
  ) {
    return 'document';
  }

  return 'unknown';
}

export function formatFileSize(bytes?: number | null): string | null {
  if (typeof bytes !== 'number' || !Number.isFinite(bytes) || bytes < 0) {
    return null;
  }

  if (bytes < 1024) {
    return `${bytes} بايت`;
  }

  const kilobytes = bytes / 1024;

  if (kilobytes < 1024) {
    return `${kilobytes.toFixed(kilobytes >= 10 ? 0 : 1)} ك.ب`;
  }

  const megabytes = kilobytes / 1024;

  return `${megabytes.toFixed(megabytes >= 10 ? 0 : 1)} م.ب`;
}

export function getFileSize(file: FileResource): number | null {
  return file.size_bytes ?? file.sizeBytes ?? file.size ?? null;
}

export function getFileUpdatedAt(file: FileResource): string | null {
  return toText(file.updated_at) ?? toText(file.created_at) ?? null;
}

export function getEntityLabel(value: unknown): string | null {
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }

  if (!isRecord(value)) {
    return null;
  }

  return (
    toText(value.name) ??
    toText(value.title) ??
    toText(value.label) ??
    toText(value.code) ??
    toText(value.id) ??
    null
  );
}

export function getVisibilityLabel(visibility: FileResource['visibility']): string | null {
  switch (visibility) {
    case 'public':
      return 'عام';
    case 'students_only':
      return 'للطلاب';
    case 'verified_students_only':
      return 'للطلاب الموثقين';
    case 'major_only':
      return 'حسب الاختصاص';
    case 'group_only':
      return 'خاص بالغروب';
    case 'admin_only':
      return 'إداري';
    default:
      return visibility ? 'صلاحية مخصصة' : null;
  }
}

export function toSafeFilesErrorMessage(error: unknown): string {
  const normalizedError = normalizeApiError(error);

  if (normalizedError.code === 'NETWORK_ERROR' || normalizedError.code === 'TIMEOUT') {
    return NETWORK_MESSAGE;
  }

  if (normalizedError.code === 'UNAUTHORIZED') {
    return UNAUTHORIZED_MESSAGE;
  }

  if (normalizedError.code === 'FORBIDDEN') {
    return PERMISSION_MESSAGE;
  }

  return normalizedError.message || GENERIC_MESSAGE;
}

export async function loadFiles(authToken: string): Promise<PaginatedResult<FileResource>> {
  return normalizeFileList(await apiFilesService.listFiles(authToken));
}

export async function loadFileDetail(fileId: Id, authToken: string): Promise<FileResource> {
  return normalizeFile(await apiFilesService.getFileDetail(fileId, authToken));
}

export async function loadGroupFiles(
  groupId: Id,
  authToken: string,
): Promise<PaginatedResult<FileResource>> {
  return normalizeFileList(await apiFilesService.listGroupFiles(groupId, authToken));
}
