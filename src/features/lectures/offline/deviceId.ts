import { ensureDeviceId } from '../../../api';

/**
 * Offline licenses are bound to (account, device). The server hashes `X-Panorama-Device-Id`, so this feature must send
 * the very same id the account device binding uses (`src/api/deviceIdentity.ts`, secure-store key
 * `panorama.device.id`). There is exactly ONE implementation: this file only adapts it for the offline requests.
 */
export const DEVICE_ID_HEADER = 'X-Panorama-Device-Id';

export function ensureOfflineDeviceId(): Promise<string> {
  return ensureDeviceId();
}

export async function offlineDeviceHeaders(): Promise<Record<string, string>> {
  return { [DEVICE_ID_HEADER]: await ensureDeviceId() };
}
