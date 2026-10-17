import * as DocumentPicker from 'expo-document-picker';

import type { PickImageResult } from './imagePicker';
import { toLocalFile, validateUploadCandidate } from './localFile';

/**
 * Lets the user pick a PDF (or an image) from the device's files. The system file picker needs no
 * storage permission; the type and size rules the server enforces are checked before uploading.
 */
export async function pickDocument(): Promise<PickImageResult> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*'],
      multiple: false,
      copyToCacheDirectory: true,
    });

    if (result.canceled) {
      return { status: 'canceled' };
    }

    const asset = result.assets[0];

    if (!asset) {
      return { status: 'error' };
    }

    const file = toLocalFile({
      uri: asset.uri,
      fileName: asset.name,
      fileSize: asset.size ?? null,
      mimeType: asset.mimeType ?? null,
    });
    const problem = validateUploadCandidate(file);

    return problem ? { status: 'invalid', problem } : { status: 'picked', file };
  } catch {
    return { status: 'error' };
  }
}
