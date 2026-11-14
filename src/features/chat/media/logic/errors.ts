export type MediaErrorKey =
  | 'voiceTooLong'
  | 'audioInvalid'
  | 'audioTooLarge'
  | 'imageInvalid'
  | 'imageTooLarge'
  | 'waveformInvalid';

const CODE_TO_KEY: Record<string, MediaErrorKey> = {
  VOICE_TOO_LONG: 'voiceTooLong',
  AUDIO_INVALID: 'audioInvalid',
  AUDIO_TOO_LARGE: 'audioTooLarge',
  IMAGE_INVALID: 'imageInvalid',
  IMAGE_TOO_LARGE: 'imageTooLarge',
  WAVEFORM_INVALID: 'waveformInvalid',
};

/** Maps the backend's machine-readable error code of a failed media upload to a message key (null = not a media error). */
export function mediaErrorKey(errorCode: string | null | undefined): MediaErrorKey | null {
  return errorCode ? (CODE_TO_KEY[errorCode.toUpperCase()] ?? null) : null;
}

/** Why opening an attachment failed, from the student's point of view. */
export type OpenFailure = 'offline' | 'gone' | 'forbidden' | 'throttled' | 'server';

export function classifyOpenFailure(input: {
  status?: number;
  network?: boolean;
  code?: string;
}): OpenFailure {
  if (input.network) {
    return 'offline';
  }

  if (input.status === 404 || input.status === 410) {
    return 'gone';
  }

  if (input.status === 401 || input.status === 403) {
    return 'forbidden';
  }

  if (input.status === 429 || input.code === 'RATE_LIMITED') {
    return 'throttled';
  }

  return 'server';
}
