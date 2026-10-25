import { MAX_ATTACHMENT_BYTES, type ChatAttachment } from '../types';

export type AttachmentProblem = 'type' | 'size' | 'empty';

const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp'] as const;
const IMAGE_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;
/** Chat documents follow the backend upload policy: PDF only (anything else is an image). */
const FILE_EXTENSIONS = ['pdf'] as const;
const FILE_MIME_TYPES = ['application/pdf', 'application/x-pdf'] as const;

export function fileExtension(name: string): string {
  const index = name.lastIndexOf('.');

  return index < 0 ? '' : name.slice(index + 1).toLowerCase();
}

function extensionForMime(mimeType: string): string {
  switch (mimeType) {
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    default:
      return 'jpg';
  }
}

/** Mirrors the backend upload policy so the user gets early feedback; the server stays authoritative. */
export function validateChatAttachment(
  file: Pick<ChatAttachment, 'name' | 'mimeType' | 'size' | 'kind'>,
): AttachmentProblem | null {
  const mime = file.mimeType.split(';')[0]?.trim().toLowerCase() ?? '';
  const extension = fileExtension(file.name);
  const extensions: readonly string[] = file.kind === 'image' ? IMAGE_EXTENSIONS : FILE_EXTENSIONS;
  const mimes: readonly string[] = file.kind === 'image' ? IMAGE_MIME_TYPES : FILE_MIME_TYPES;

  if (!extensions.includes(extension)) {
    return 'type';
  }

  if (mime && mime !== 'application/octet-stream' && !mimes.includes(mime)) {
    return 'type';
  }

  if (file.size <= 0) {
    return 'empty';
  }

  return file.size > MAX_ATTACHMENT_BYTES ? 'size' : null;
}

/** Builds an attachment from an image-picker asset, filling in a safe name and type. */
export function toChatAttachment(
  asset: { uri: string; fileName?: string | null; mimeType?: string | null; fileSize?: number },
  now: number = Date.now(),
): ChatAttachment {
  const mimeType = asset.mimeType?.toLowerCase() || 'image/jpeg';
  const rawName = asset.fileName?.trim();
  const name =
    rawName && fileExtension(rawName) ? rawName : `photo-${now}.${extensionForMime(mimeType)}`;

  return { uri: asset.uri, name, mimeType, size: asset.fileSize ?? 0, kind: 'image' };
}

/** Builds a document attachment from a document-picker asset (PDF only). */
export function toChatDocument(asset: {
  uri: string;
  name?: string | null;
  mimeType?: string | null;
  size?: number | null;
}): ChatAttachment {
  return {
    uri: asset.uri,
    name: asset.name?.trim() || 'document.pdf',
    mimeType: asset.mimeType?.toLowerCase() || 'application/pdf',
    size: asset.size ?? 0,
    kind: 'file',
  };
}

/** Multipart body for `POST /groups/{id}/messages/`. */
export function buildMessageFormData(input: {
  content: string;
  attachment: ChatAttachment;
}): FormData {
  const form = new FormData();

  if (input.content) {
    form.append('content', input.content);
  }

  form.append('message_type', input.attachment.kind === 'image' ? 'image' : 'file');
  // React Native reads a `{uri, name, type}` part straight from disk.
  form.append('attachment', {
    uri: input.attachment.uri,
    name: input.attachment.name,
    type: input.attachment.mimeType,
  } as unknown as Blob);

  return form;
}

/** A file chosen through the shared attachment picker, shaped for the chat composer (images are photos, the rest documents). */
export function localFileToChatAttachment(file: {
  uri: string;
  name: string;
  size: number | null;
  mimeType: string | null;
}): ChatAttachment {
  const isImage = (IMAGE_EXTENSIONS as readonly string[]).includes(fileExtension(file.name));

  return {
    uri: file.uri,
    name: file.name,
    mimeType: file.mimeType ?? (isImage ? 'image/jpeg' : 'application/pdf'),
    size: file.size ?? 0,
    kind: isImage ? 'image' : 'file',
  };
}
