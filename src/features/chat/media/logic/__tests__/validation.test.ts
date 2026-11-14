import {
  planImageCompression,
  validateAudioFile,
  validateDocumentBytes,
  validateImageBytes,
  validateVoice,
} from '../validation';
import {
  AUDIO_FILE_MAX_BYTES,
  IMAGE_MAX_BYTES,
  MB,
  VOICE_MAX_BYTES,
  VOICE_MAX_MS,
} from '../limits';
import { classifyOpenFailure, mediaErrorKey } from '../errors';
import { buildMessageFormData, validateChatAttachment } from '../../../logic/attachments';

const partsOf = (form: FormData) => ({
  get: (name: string) => form.get(name) ?? undefined,
  has: (name: string) => form.has(name),
});

describe('validateAudioFile', () => {
  const ok = { name: 'lecture.m4a', size: 3 * MB, mimeType: 'audio/mp4' };

  it('accepts the formats the server accepts', () => {
    for (const [name, mimeType] of [
      ['a.m4a', 'audio/x-m4a'],
      ['a.mp4', 'audio/mp4'],
      ['a.aac', 'audio/aac'],
      ['a.mp3', 'audio/mpeg'],
      ['a.ogg', 'audio/ogg'],
      ['a.opus', 'audio/opus'],
      ['a.WAV', 'audio/x-wav'],
      ['a.m4a', 'application/octet-stream'],
      ['a.m4a', null],
    ] as const) {
      expect(validateAudioFile({ name, size: 100, mimeType })).toBeNull();
    }
  });

  it('refuses webm and other types', () => {
    expect(validateAudioFile({ ...ok, name: 'a.webm', mimeType: 'audio/webm' })).toBe('webm');
    expect(validateAudioFile({ ...ok, mimeType: 'audio/webm' })).toBe('webm');
    expect(validateAudioFile({ ...ok, name: 'a.flac', mimeType: 'audio/flac' })).toBe('type');
    expect(validateAudioFile({ ...ok, mimeType: 'application/pdf' })).toBe('type');
    expect(validateAudioFile({ ...ok, name: 'noext' })).toBe('type');
  });

  it('enforces 25 MB, rejects empty; unknown size passes', () => {
    expect(validateAudioFile({ ...ok, size: AUDIO_FILE_MAX_BYTES })).toBeNull();
    expect(validateAudioFile({ ...ok, size: AUDIO_FILE_MAX_BYTES + 1 })).toBe('size');
    expect(validateAudioFile({ ...ok, size: 0 })).toBe('empty');
    expect(validateAudioFile({ ...ok, size: null })).toBeNull();
  });
});

describe('voice, image, document limits', () => {
  it('allows 300 s (+1 s tolerance) and 5 MB', () => {
    expect(validateVoice({ size: 1000, durationMs: VOICE_MAX_MS })).toBeNull();
    expect(validateVoice({ size: 1000, durationMs: VOICE_MAX_MS + 1000 })).toBeNull();
    expect(validateVoice({ size: 1000, durationMs: VOICE_MAX_MS + 1001 })).toBe('voiceTooLong');
    expect(validateVoice({ size: VOICE_MAX_BYTES + 1, durationMs: 1000 })).toBe('voiceSize');
    expect(validateVoice({ size: 0, durationMs: 1000 })).toBe('empty');
  });

  it('enforces 10 MB images and 25 MB documents', () => {
    expect(validateImageBytes(IMAGE_MAX_BYTES)).toBeNull();
    expect(validateImageBytes(IMAGE_MAX_BYTES + 1)).toBe('imageSize');
    expect(validateDocumentBytes(25 * MB + 1)).toBe('size');
    expect(validateDocumentBytes(null)).toBeNull();
  });

  it('compresses only big or very wide photos', () => {
    expect(planImageCompression({ size: 2 * MB, width: 1600, height: 1200 })).toBeNull();
    expect(planImageCompression({ size: 9 * MB, width: 4000, height: 3000 })).toEqual({
      maxEdge: 2048,
      quality: 0.7,
    });
    expect(planImageCompression({ size: 3 * MB, width: 4000, height: 3000 })).toEqual({
      maxEdge: 2048,
      quality: 0.82,
    });
  });
});

describe('chat attachment kinds', () => {
  it('validates voice and audio through validateChatAttachment', () => {
    const voice = { name: 'v.m4a', mimeType: 'audio/mp4', size: 1000, kind: 'voice' as const };

    expect(validateChatAttachment({ ...voice, durationMs: 4000 })).toBeNull();
    expect(validateChatAttachment({ ...voice, durationMs: 400_000 })).toBe('size');
    expect(
      validateChatAttachment({ name: 'a.flac', mimeType: 'audio/flac', size: 10, kind: 'audio' }),
    ).toBe('type');
    expect(
      validateChatAttachment({ name: 'a.mp3', mimeType: 'audio/mpeg', size: 0, kind: 'audio' }),
    ).toBe('empty');
  });

  it('sends message_type, duration_ms and a valid waveform for voice notes', () => {
    const parts = partsOf(
      buildMessageFormData({
        content: '',
        attachment: {
          uri: 'file:///v.m4a',
          name: 'voice.m4a',
          mimeType: 'audio/mp4',
          size: 100,
          kind: 'voice',
          durationMs: 4123.4,
          waveform: [1, 2, 3],
        },
      }),
    );

    expect(parts.get('message_type')).toBe('voice');
    expect(parts.get('duration_ms')).toBe('4123');
    expect(parts.get('waveform')).toBe('[1,2,3]');
  });

  it('omits an invalid waveform instead of failing the upload', () => {
    const parts = partsOf(
      buildMessageFormData({
        content: '',
        attachment: {
          uri: 'u',
          name: 'a.mp3',
          mimeType: 'audio/mpeg',
          size: 1,
          kind: 'audio',
          waveform: [999],
        },
      }),
    );

    expect(parts.get('message_type')).toBe('audio');
    expect(parts.has('waveform')).toBe(false);
  });
});

describe('error mapping', () => {
  it('maps backend codes to message keys', () => {
    expect(mediaErrorKey('VOICE_TOO_LONG')).toBe('voiceTooLong');
    expect(mediaErrorKey('audio_invalid')).toBe('audioInvalid');
    expect(mediaErrorKey('AUDIO_TOO_LARGE')).toBe('audioTooLarge');
    expect(mediaErrorKey('IMAGE_INVALID')).toBe('imageInvalid');
    expect(mediaErrorKey('IMAGE_TOO_LARGE')).toBe('imageTooLarge');
    expect(mediaErrorKey('WAVEFORM_INVALID')).toBe('waveformInvalid');
    expect(mediaErrorKey('SOMETHING_ELSE')).toBeNull();
    expect(mediaErrorKey(undefined)).toBeNull();
  });

  it('classifies why opening failed', () => {
    expect(classifyOpenFailure({ network: true })).toBe('offline');
    expect(classifyOpenFailure({ status: 404 })).toBe('gone');
    expect(classifyOpenFailure({ status: 403 })).toBe('forbidden');
    expect(classifyOpenFailure({ status: 429 })).toBe('throttled');
    expect(classifyOpenFailure({ status: 500 })).toBe('server');
  });
});
