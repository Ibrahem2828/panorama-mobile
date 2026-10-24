/**
 * Permission state logic, free of platform calls so it can be tested.
 *
 * The app uses four capabilities. Only notifications and the camera are runtime permissions; the photo album (system photo
 * picker) and the device's files (system document picker) need no permission at all, and the screen says so instead of asking.
 */
export type PermissionKey = 'notifications' | 'camera' | 'photos' | 'files';

export type PermissionStatus =
  | 'granted'
  /** Asked before and refused, but the system will still show the prompt. */
  | 'denied'
  /** Refused for good: only the app settings can change it. */
  | 'blocked'
  /** Never asked. */
  | 'undetermined'
  /** The capability works without a permission (system pickers). */
  | 'not_needed';

export type RawPermission = {
  granted: boolean;
  canAskAgain: boolean;
  status?: string;
};

export type PermissionDefinition = {
  key: PermissionKey;
  /** True when the system shows a permission dialog for it. */
  runtime: boolean;
};

/** Order of the guided flow: notifications first (they matter most), then the camera, then the informational rows. */
export const PERMISSION_DEFINITIONS: readonly PermissionDefinition[] = [
  { key: 'notifications', runtime: true },
  { key: 'camera', runtime: true },
  { key: 'photos', runtime: false },
  { key: 'files', runtime: false },
];

export type PermissionSnapshot = Record<PermissionKey, PermissionStatus>;

export const INITIAL_SNAPSHOT: PermissionSnapshot = {
  notifications: 'undetermined',
  camera: 'undetermined',
  photos: 'not_needed',
  files: 'not_needed',
};

/** Maps an expo permission response to the status shown in the app. */
export function toPermissionStatus(raw: RawPermission): PermissionStatus {
  if (raw.granted) {
    return 'granted';
  }

  if (!raw.canAskAgain) {
    // A fresh install also reports canAskAgain=false on some Android builds before the first prompt: only a status that
    // says "denied" proves a refusal.
    return raw.status === 'undetermined' ? 'undetermined' : 'blocked';
  }

  return raw.status === 'undetermined' ? 'undetermined' : 'denied';
}

/** True when the user can act on this status with the system dialog. */
export function canRequest(status: PermissionStatus): boolean {
  return status === 'undetermined' || status === 'denied';
}

/** Runtime permissions the guided "Allow all" flow still has to ask for, in order. */
export function pendingRequests(snapshot: PermissionSnapshot): PermissionKey[] {
  return PERMISSION_DEFINITIONS.filter(
    (definition) => definition.runtime && canRequest(snapshot[definition.key]),
  ).map((definition) => definition.key);
}

/** True while at least one runtime permission is still open (not granted). */
export function hasOpenPermissions(snapshot: PermissionSnapshot): boolean {
  return PERMISSION_DEFINITIONS.some(
    (definition) => definition.runtime && snapshot[definition.key] !== 'granted',
  );
}

/** Permissions that were refused for good and need the app settings. */
export function blockedPermissions(snapshot: PermissionSnapshot): PermissionKey[] {
  return PERMISSION_DEFINITIONS.filter((definition) => snapshot[definition.key] === 'blocked').map(
    (definition) => definition.key,
  );
}

/** Whether the first-run permissions screen is still worth showing. */
export function shouldShowPermissionsIntro(input: {
  alreadyShown: boolean;
  snapshot: PermissionSnapshot;
}): boolean {
  return !input.alreadyShown && hasOpenPermissions(input.snapshot);
}
