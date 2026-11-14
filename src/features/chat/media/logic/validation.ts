import {
  AUDIO_EXTENSIONS,
  AUDIO_FILE_MAX_BYTES,
  DOCUMENT_MAX_BYTES,
  IMAGE_MAX_BYTES,
  VOICE_MAX_BYTES,
  VOICE_MAX_MS,
} from './limits';

export type MediaProblem =
  | 'type'
  | 'size'
  | 'empty'
  | 'webm'
  | 'imageSize'
  | 'voiceSize'
  | 'voiceTooLong';

function extensionOf(name: string): string {
  const index = name.lastIndexOf('.');

  return index < 0 ? '' : name.slice(index + 1).toLowerCase();
}

function baseMime(mime: string | null | undefined): string {
  return (mime ?? '').split(';')[0]?.trim().toLowerCase() ?? '';
}

/** MIME types the document picker is restricted to for "audio file". */
export const AUDIO_PICKER_TYPES = [
  'audio/mp4',
  'audio/x-m4a',
  'audio/m4a',
  'audio/aac',
  'audio/mpeg',
  'audio/ogg',
  'audio/opus',
  'audio/wav',
  'audio/x-wav',
  'audio/vnd.wave',
] as const;

const AUDIO_MIMES = new Set<string>([
  ...AUDIO_PICKER_TYPES,
  'audio/mp3',
  'audio/wave',
  'audio/x-aac',
  'audio/x-mpeg',
  'audio/vorbis',
  // Some pickers report m4a/mp4 audio as video/mp4.
  'video/mp4',
]);

/** Uploaded audio: m4a/mp4, aac, mp3, ogg/opus, wav up to 25 MB. WebM is refused (the server cannot verify its length). */
export function validateAudioFile(file: {
  name: string;
  size: number | null;
  mimeType?: string | null;
}): MediaProblem | null {
  const extension = extensionOf(file.name);
  const mime = baseMime(file.mimeType);

  if (extension === 'webm' || mime === 'audio/webm' || mime === 'video/webm') {
    return 'webm';
  }

  if (!(AUDIO_EXTENSIONS as readonly string[]).includes(extension)) {
    return 'type';
  }

  if (mime && mime !== 'application/octet-stream' && !AUDIO_MIMES.has(mime)) {
    return 'type';
  }

  if (file.size !== null) {
    if (file.size <= 0) {
      return 'empty';
    }

    if (file.size > AUDIO_FILE_MAX_BYTES) {
      return 'size';
    }
  }

  return null;
}

/** A recorded voice message: at most 5 minutes and 5 MB. */
export function validateVoice(clip: {
  size: number | null;
  durationMs: number;
}): MediaProblem | null {
  if (clip.durationMs > VOICE_MAX_MS + 1000) {
    return 'voiceTooLong';
  }

  if (clip.size !== null) {
    if (clip.size <= 0) {
      return 'empty';
    }

    if (clip.size > VOICE_MAX_BYTES) {
      return 'voiceSize';
    }
  }

  return null;
}

/** Image bytes must be under 10 MB once the app compressed them. */
export function validateImageBytes(size: number | null): MediaProblem | null {
  if (size === null) {
    return null;
  }

  if (size <= 0) {
    return 'empty';
  }

  return size > IMAGE_MAX_BYTES ? 'imageSize' : null;
}

export function validateDocumentBytes(size: number | null): MediaProblem | null {
  if (size === null) {
    return null;
  }

  if (size <= 0) {
    return 'empty';
  }

  return size > DOCUMENT_MAX_BYTES ? 'size' : null;
}

/**
 * Decides how to shrink a photo before upload so it fits 10 MB: it is only re-encoded when it is large or very wide.
 * Returns null when the picked file can be sent as it is.
 */
export function planImageCompression(input: {
  size: number | null;
  width?: number | null;
  height?: number | null;
}): { maxEdge: number; quality: number } | null {
  const longEdge = Math.max(input.width ?? 0, input.height ?? 0);
  const tooBig = input.size !== null && input.size > IMAGE_MAX_BYTES * 0.8;

  if (!tooBig && longEdge <= 2560) {
    return null;
  }

  return { maxEdge: 2048, quality: tooBig ? 0.7 : 0.82 };
}
