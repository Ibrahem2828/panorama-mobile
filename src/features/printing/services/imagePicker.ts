import * as ImagePicker from 'expo-image-picker';

import type { PrintLocalFile, UploadProblem } from '../types';
import { toLocalFile, validateUploadCandidate } from './printDraft';

export type PickPrintImageResult =
  | { status: 'picked'; file: PrintLocalFile }
  | { status: 'canceled' }
  | { status: 'invalid'; problem: UploadProblem }
  | { status: 'error' };

/**
 * Lets the student pick an image from the phone's library. The system photo picker needs no
 * storage permission. Documents (PDF) cannot be picked with the bundled packages, so only
 * images are offered; the same size and type rules the server enforces are checked first.
 */
export async function pickPrintImage(): Promise<PickPrintImageResult> {
  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: false,
      allowsEditing: false,
      quality: 0.85,
    });

    const asset = result.canceled ? null : result.assets[0];

    if (result.canceled) {
      return { status: 'canceled' };
    }

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
