import {
  filesService as apiFilesService,
  normalizeApiError,
  type FileRecord,
  type PaginatedResult,
  type FileAccessTicket,
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

function normalizeFile(record: FileRecord): FileResource {
  return {
    ...record,
    id: record.id,
    title: toText(record.title),
    name: toText(record.name),
    description: toNullableText(record.description),
    file_type: toNullableText(record.file_type),
    file_size: toNumber(record.file_size),
    pages_count: toNumber(record.pages_count),
    preview_ticket_endpoint: toNullableText(record.preview_ticket_endpoint),
    download_allowed: record.download_allowed === true,
    is_printable: record.is_printable !== false,
    is_active: record.is_active !== false,
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

export function canRequestProtectedPreview(file: FileResource): boolean {
  return file.is_active !== false && Boolean(file.preview_ticket_endpoint || file.id);
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

  const backendType = toText(file.file_type)?.replace(/^\./u, '').toLowerCase();
  if (backendType) return backendType;
  return null;
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
  return file.file_size ?? file.size_bytes ?? file.sizeBytes ?? file.size ?? null;
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
      return 'خاص بالمجموعة';
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

export async function requestProtectedFileTicket(
  fileId: Id,
  authToken: string,
): Promise<FileAccessTicket> {
  return apiFilesService.requestFileAccessTicket(fileId, authToken);
}
