import { DOCUMENT_POLICY } from './attachmentPolicy';
import { pickFromSource, type PickSourceResult } from './pickSource';
import type { LocalFile, UploadProblem } from './localFile';

export type PickImageResult =
  | { status: 'picked'; file: LocalFile }
  | { status: 'canceled' }
  | { status: 'invalid'; problem: UploadProblem }
  | { status: 'permission_denied'; canOpenSettings: boolean }
  | { status: 'error' };

/** One file out of a multi-file pick result (single-file spots). */
export function firstPicked(result: PickSourceResult): PickImageResult {
  if (result.status === 'picked') {
    const file = result.files[0];

    return file ? { status: 'picked', file } : { status: 'error' };
  }

  if (result.status === 'invalid') {
    return { status: 'invalid', problem: result.problem };
  }

  return result;
}

/** One image from the photo album (system photo picker, no storage permission). */
export async function pickImage(): Promise<PickImageResult> {
  return firstPicked(await pickFromSource('album', DOCUMENT_POLICY));
}

/** One photo taken with the camera (asks for the camera permission when needed). */
export async function pickPhoto(): Promise<PickImageResult> {
  return firstPicked(await pickFromSource('camera', DOCUMENT_POLICY));
}
