import * as ImagePicker from 'expo-image-picker';

import {
  toLocalFile,
  validateUploadCandidate,
  type LocalFile,
  type UploadProblem,
} from './localFile';

export type PickImageResult =
  | { status: 'picked'; file: LocalFile }
  | { status: 'canceled' }
  | { status: 'invalid'; problem: UploadProblem }
  | { status: 'error' };

/**
 * Lets the user pick an image from the phone's library. The system photo picker needs no
 * storage permission. Documents (PDF) cannot be picked with the bundled packages, so only
 * images are offered; the size and type rules the server enforces are checked first.
 */
export async function pickImage(): Promise<PickImageResult> {
  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: false,
      allowsEditing: false,
      quality: 0.85,
    });

    if (result.canceled) {
      return { status: 'canceled' };
    }

    const asset = result.assets[0];

    if (!asset) {
      return { status: 'error' };
    }

    const file = toLocalFile(asset);
    const problem = validateUploadCandidate(file);

    return problem ? { status: 'invalid', problem } : { status: 'picked', file };
  } catch {
    return { status: 'error' };
  }
}
