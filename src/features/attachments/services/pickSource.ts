import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

import {
  documentPickerTypes,
  validateAgainstPolicy,
  type AttachmentPolicy,
  type AttachmentSource,
} from './attachmentPolicy';
import { toLocalFile, type LocalFile, type UploadProblem } from './localFile';

export type PickSourceResult =
  | { status: 'picked'; files: LocalFile[] }
  | { status: 'canceled' }
  | { status: 'invalid'; problem: UploadProblem; fileName: string }
  /** The camera was refused; `canOpenSettings` is true when the system will not ask again. */
  | { status: 'permission_denied'; canOpenSettings: boolean }
  | { status: 'error' };

export type PickOptions = {
  /** Crop UI after picking (verification card). Off for screenshots and documents. */
  allowsEditing?: boolean;
  aspect?: [number, number];
  quality?: number;
};

function accept(files: LocalFile[], policy: AttachmentPolicy): PickSourceResult {
  if (files.length === 0) {
    return { status: 'error' };
  }

  for (const file of files) {
    const problem = validateAgainstPolicy(file, policy);

    if (problem) {
      return { status: 'invalid', problem, fileName: file.name };
    }
  }

  return { status: 'picked', files };
}

function fromImageAssets(result: ImagePicker.ImagePickerResult, policy: AttachmentPolicy) {
  if (result.canceled) {
    return { status: 'canceled' } as const;
  }

  const limit = policy.multiple ? (policy.maxFiles ?? 10) : 1;

  return accept(
    result.assets.slice(0, limit).map((asset) => toLocalFile(asset)),
    policy,
  );
}

/** The photo album through the system photo picker: it needs no storage permission on current Android / iOS. */
async function pickAlbum(
  policy: AttachmentPolicy,
  options: PickOptions,
): Promise<PickSourceResult> {
  const multiple = Boolean(policy.multiple) && !options.allowsEditing;

  return fromImageAssets(
    await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: multiple,
      selectionLimit: multiple ? (policy.maxFiles ?? 10) : 1,
      allowsEditing: options.allowsEditing ?? false,
      aspect: options.aspect,
      exif: false,
      quality: options.quality ?? 0.85,
    }),
    policy,
  );
}

/** The camera is the only source that needs a permission; a permanent refusal sends the user to the app settings. */
async function pickCamera(
  policy: AttachmentPolicy,
  options: PickOptions,
): Promise<PickSourceResult> {
  let permission = await ImagePicker.getCameraPermissionsAsync();

  if (!permission.granted && permission.canAskAgain) {
    permission = await ImagePicker.requestCameraPermissionsAsync();
  }

  if (!permission.granted) {
    return { status: 'permission_denied', canOpenSettings: !permission.canAskAgain };
  }

  return fromImageAssets(
    await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: options.allowsEditing ?? false,
      aspect: options.aspect,
      exif: false,
      quality: options.quality ?? 0.85,
    }),
    policy,
  );
}

/** The device's files through the system document picker (no permission needed). */
async function pickDocuments(policy: AttachmentPolicy): Promise<PickSourceResult> {
  const result = await DocumentPicker.getDocumentAsync({
    type: documentPickerTypes(policy),
    multiple: Boolean(policy.multiple),
    copyToCacheDirectory: true,
  });

  if (result.canceled) {
    return { status: 'canceled' };
  }

  const limit = policy.multiple ? (policy.maxFiles ?? 10) : 1;

  return accept(
    result.assets.slice(0, limit).map((asset) =>
      toLocalFile({
        uri: asset.uri,
        fileName: asset.name,
        fileSize: asset.size ?? null,
        mimeType: asset.mimeType ?? null,
      }),
    ),
    policy,
  );
}

/**
 * The single entry point for choosing something to upload: album, camera or file. Validates every picked file against the
 * spot's policy and never throws (a failure is a `status`, so a denied permission or a broken picker never crashes a screen).
 */
export async function pickFromSource(
  source: AttachmentSource,
  policy: AttachmentPolicy,
  options: PickOptions = {},
): Promise<PickSourceResult> {
  if (!policy.sources.includes(source)) {
    return { status: 'error' };
  }

  try {
    switch (source) {
      case 'album':
        return await pickAlbum(policy, options);
      case 'camera':
        return await pickCamera(policy, options);
      default:
        return await pickDocuments(policy);
    }
  } catch {
    return { status: 'error' };
  }
}
