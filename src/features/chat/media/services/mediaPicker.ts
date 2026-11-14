import { File, Paths } from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

import { pickAudioDocument } from '../../../attachments';
import type { ChatAttachment } from '../../types';
import {
  AUDIO_PICKER_TYPES,
  planImageCompression,
  validateAudioFile,
  validateImageBytes,
  type MediaProblem,
} from '../logic/validation';

export type AudioPickResult =
  | { status: 'picked'; attachment: ChatAttachment }
  | { status: 'canceled' }
  | { status: 'invalid'; problem: MediaProblem }
  | { status: 'error' };

/** Audio files (a doctor's lecture recording...) through the shared picker, restricted to the formats the server accepts. */
export async function pickAudioFile(): Promise<AudioPickResult> {
  const picked = await pickAudioDocument(AUDIO_PICKER_TYPES);

  if (picked.status !== 'picked') {
    return picked;
  }

  const { file } = picked;
  const problem = validateAudioFile({ name: file.name, size: file.size, mimeType: file.mimeType });

  if (problem) {
    return { status: 'invalid', problem };
  }

  return {
    status: 'picked',
    attachment: {
      uri: file.uri,
      name: file.name,
      mimeType:
        file.mimeType && file.mimeType !== 'application/octet-stream' ? file.mimeType : 'audio/mp4',
      size: file.size ?? 0,
      kind: 'audio',
    },
  };
}

export type PreparedImage =
  | { ok: true; attachment: ChatAttachment }
  | { ok: false; problem: MediaProblem };

/**
 * Shrinks a photo so it fits the 10 MB server limit (long edge 2048 px, JPEG) when it is large or very wide; small photos are
 * sent as they are. If compression is impossible the original is used and the size check decides.
 */
export async function prepareImage(
  attachment: ChatAttachment,
  dimensions: { width?: number | null; height?: number | null } = {},
): Promise<PreparedImage> {
  const plan = planImageCompression({ size: attachment.size || null, ...dimensions });
  let result = attachment;

  if (plan) {
    try {
      const wide = (dimensions.width ?? 0) >= (dimensions.height ?? 0);
      const shrunk = await manipulateAsync(
        attachment.uri,
        [{ resize: wide ? { width: plan.maxEdge } : { height: plan.maxEdge } }],
        { compress: plan.quality, format: SaveFormat.JPEG },
      );
      const size = new File(shrunk.uri).size;
      const baseName = attachment.name.replace(/\.[^.]+$/u, '') || 'photo';

      result = {
        ...attachment,
        uri: shrunk.uri,
        name: `${baseName}.jpg`,
        mimeType: 'image/jpeg',
        size,
      };
    } catch {
      result = attachment;
    }
  }

  const problem = validateImageBytes(result.size || null);

  return problem ? { ok: false, problem } : { ok: true, attachment: result };
}

/** The recorded voice file's size, for validation before upload. */
export function fileSize(uri: string): number {
  try {
    return new File(uri).size;
  } catch {
    return 0;
  }
}

/** Deletes a temporary copy (a compressed photo, a picked audio copy, a recording) once it was sent or discarded. */
export function deleteTemp(uri: string | null | undefined): void {
  if (!uri) {
    return;
  }

  try {
    // Only ever our own cache copies (recordings, compressed photos, picker copies), never a file the student owns.
    if (!uri.startsWith(Paths.cache.uri)) {
      return;
    }

    const file = new File(uri);

    if (file.exists) {
      file.delete();
    }
  } catch {
    // Private cache directory; harmless if it stays until the OS clears it.
  }
}
