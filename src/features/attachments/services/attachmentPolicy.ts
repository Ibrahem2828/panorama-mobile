import {
  CONVERTIBLE_EXTENSIONS,
  CONVERTIBLE_MIME_TYPES,
  fileExtension,
  MAX_UPLOAD_BYTES,
  UPLOAD_EXTENSIONS,
  UPLOAD_MIME_TYPES,
  type LocalFile,
  type UploadProblem,
} from './localFile';

export type AttachmentSource = 'album' | 'camera' | 'document';

/** What one upload spot accepts. Every spot keeps the limits its own backend endpoint enforces. */
export type AttachmentPolicy = {
  /** Where the user may pick from (the picker offers only these). */
  sources: readonly AttachmentSource[];
  /** Lowercase extensions without the dot. */
  extensions: readonly string[];
  /** MIME types for the system document picker (images are always offered through the album). */
  mimeTypes: readonly string[];
  maxBytes: number;
  /** Several files at once (album and document pickers). */
  multiple?: boolean;
  maxFiles?: number;
};

const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp'] as const;
const IMAGE_MIMES = ['image/png', 'image/jpeg', 'image/webp'] as const;

/** Support tickets and generic uploads: the backend document policy (pdf/png/jpg/webp, 25 MB). */
export const DOCUMENT_POLICY: AttachmentPolicy = {
  sources: ['album', 'camera', 'document'],
  extensions: UPLOAD_EXTENSIONS,
  mimeTypes: UPLOAD_MIME_TYPES,
  maxBytes: MAX_UPLOAD_BYTES,
};

/** Print orders: documents, images and Word/PowerPoint (converted to PDF by the server). */
export const PRINT_POLICY: AttachmentPolicy = {
  sources: ['album', 'camera', 'document'],
  extensions: [...UPLOAD_EXTENSIONS, ...CONVERTIBLE_EXTENSIONS],
  mimeTypes: [...UPLOAD_MIME_TYPES, ...CONVERTIBLE_MIME_TYPES],
  maxBytes: MAX_UPLOAD_BYTES,
};

/** Chat: photos and PDF documents only (the chat endpoint's policy). */
export const CHAT_POLICY: AttachmentPolicy = {
  sources: ['album', 'camera', 'document'],
  extensions: ['pdf', ...IMAGE_EXTENSIONS],
  mimeTypes: ['application/pdf', ...IMAGE_MIMES],
  maxBytes: MAX_UPLOAD_BYTES,
};

/** Learnata screenshot and similar single images. */
export const IMAGE_ONLY_POLICY: AttachmentPolicy = {
  sources: ['album', 'camera'],
  extensions: IMAGE_EXTENSIONS,
  mimeTypes: IMAGE_MIMES,
  maxBytes: 8 * 1024 * 1024,
};

/** Mime filter handed to the system document picker. */
export function documentPickerTypes(policy: AttachmentPolicy): string[] {
  const hasImages = policy.extensions.some((extension) =>
    (IMAGE_EXTENSIONS as readonly string[]).includes(extension),
  );

  return Array.from(new Set([...policy.mimeTypes, ...(hasImages ? ['image/*'] : [])]));
}

/** Returns what is wrong with a picked file for this spot, or null when it is acceptable. */
export function validateAgainstPolicy(
  file: Pick<LocalFile, 'name' | 'size' | 'mimeType'>,
  policy: AttachmentPolicy,
): UploadProblem | null {
  if (!policy.extensions.includes(fileExtension(file.name))) {
    return 'type';
  }

  const mime = (file.mimeType ?? '').split(';')[0]?.trim().toLowerCase() ?? '';

  if (mime && mime !== 'application/octet-stream' && !policy.mimeTypes.includes(mime)) {
    return 'type';
  }

  if (file.size !== null) {
    if (file.size <= 0) {
      return 'empty';
    }

    if (file.size > policy.maxBytes) {
      return 'size';
    }
  }

  return null;
}

/** Human size limit for messages, e.g. 25 or 8 (megabytes). */
export function policyLimitMegabytes(policy: AttachmentPolicy): number {
  return Math.round(policy.maxBytes / (1024 * 1024));
}
