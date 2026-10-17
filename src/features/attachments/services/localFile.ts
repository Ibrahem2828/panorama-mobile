/** A file picked on the device and not yet uploaded. */
export type LocalFile = {
  uri: string;
  name: string;
  /** Bytes, or null when the platform could not tell. The server stays authoritative. */
  size: number | null;
  mimeType: string | null;
};

export type UploadProblem = 'type' | 'size' | 'empty';

/** Backend document upload policy (pdf/png/jpg/jpeg/webp, 1 byte .. 25 MB). */
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

export const UPLOAD_EXTENSIONS = ['pdf', 'png', 'jpg', 'jpeg', 'webp'] as const;
export const UPLOAD_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
] as const;

/** Word/PowerPoint files are not printable as-is; the server converts them to PDF first. */
export const CONVERTIBLE_EXTENSIONS = ['doc', 'docx', 'ppt', 'pptx'] as const;
export const CONVERTIBLE_MIME_TYPES = [
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
] as const;

const MIME_BY_EXTENSION: Record<string, string> = {
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
};

export function fileExtension(name: string): string {
  const index = name.lastIndexOf('.');

  return index < 0 ? '' : name.slice(index + 1).toLowerCase();
}

export function isConvertibleDocument(name: string): boolean {
  return (CONVERTIBLE_EXTENSIONS as readonly string[]).includes(fileExtension(name));
}

/** Same size rules as uploads; the type must be a Word/PowerPoint extension. */
export function validateConvertibleCandidate(
  file: Pick<LocalFile, 'name' | 'size'>,
): UploadProblem | null {
  if (!isConvertibleDocument(file.name)) {
    return 'type';
  }

  if (file.size !== null) {
    if (file.size <= 0) {
      return 'empty';
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return 'size';
    }
  }

  return null;
}

/** Returns what is wrong with a candidate upload, or null when it satisfies the policy. */
export function validateUploadCandidate(
  file: Pick<LocalFile, 'name' | 'size' | 'mimeType'>,
): UploadProblem | null {
  if (!(UPLOAD_EXTENSIONS as readonly string[]).includes(fileExtension(file.name))) {
    return 'type';
  }

  const mime = (file.mimeType ?? '').split(';')[0]?.trim().toLowerCase() ?? '';

  if (
    mime &&
    mime !== 'application/octet-stream' &&
    !(UPLOAD_MIME_TYPES as readonly string[]).includes(mime)
  ) {
    return 'type';
  }

  if (file.size !== null) {
    if (file.size <= 0) {
      return 'empty';
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return 'size';
    }
  }

  return null;
}

/** Builds a local file from an image-picker asset, filling the gaps platforms leave. */
export function toLocalFile(asset: {
  uri: string;
  fileName?: string | null;
  fileSize?: number | null;
  mimeType?: string | null;
}): LocalFile {
  const uriName = asset.uri.split('?')[0]?.split('/').pop() ?? '';
  const rawName = (asset.fileName ?? uriName).trim();
  const extensionFromMime = Object.entries(MIME_BY_EXTENSION).find(
    ([, mime]) => mime === asset.mimeType?.toLowerCase(),
  )?.[0];
  const hasKnownExtension =
    (UPLOAD_EXTENSIONS as readonly string[]).includes(fileExtension(rawName)) ||
    isConvertibleDocument(rawName);
  const name = hasKnownExtension
    ? rawName
    : `${rawName || `photo-${Date.now().toString(36)}`}.${extensionFromMime ?? 'jpg'}`;

  return {
    uri: asset.uri,
    name,
    size: typeof asset.fileSize === 'number' && asset.fileSize >= 0 ? asset.fileSize : null,
    mimeType: asset.mimeType ?? MIME_BY_EXTENSION[fileExtension(name)] ?? null,
  };
}

export function mimeTypeOf(file: LocalFile): string {
  return file.mimeType ?? MIME_BY_EXTENSION[fileExtension(file.name)] ?? 'application/octet-stream';
}

/** React Native streams a { uri, name, type } descriptor straight from disk. */
export function appendLocalFile(form: FormData, field: string, file: LocalFile) {
  form.append(field, { uri: file.uri, name: file.name, type: mimeTypeOf(file) } as unknown as Blob);
}

/** Stable text for a file, used to scope idempotency keys. */
export function localFileSignature(file: LocalFile | null | undefined): string {
  return file ? `${file.uri}:${file.size ?? 0}` : '-';
}
