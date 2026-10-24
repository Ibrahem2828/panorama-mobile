import { PRINT_POLICY } from './attachmentPolicy';
import { firstPicked, type PickImageResult } from './imagePicker';
import { pickFromSource } from './pickSource';

/**
 * Lets the user pick a PDF, an image or a Word/PowerPoint file from the device's files. The system file picker needs no
 * storage permission; the type and size rules the server enforces are checked before uploading.
 */
export async function pickDocument(): Promise<PickImageResult> {
  return firstPicked(await pickFromSource('document', PRINT_POLICY));
}
