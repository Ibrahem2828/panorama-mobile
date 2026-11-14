/** Chat media limits. They mirror the backend (settings CHAT_*), which stays authoritative; the app only fails early. */
export const MB = 1024 * 1024;

export const VOICE_MAX_MS = 300_000;
/** Shorter clips are discarded as accidental taps. */
export const VOICE_MIN_MS = 800;
/** From here on the recorder tells the student how much time is left. */
export const VOICE_WARN_AT_MS = 270_000;
export const VOICE_MAX_BYTES = 5 * MB;
export const AUDIO_FILE_MAX_BYTES = 25 * MB;
export const IMAGE_MAX_BYTES = 10 * MB;
export const DOCUMENT_MAX_BYTES = 25 * MB;
export const WAVEFORM_MAX_VALUES = 128;
/** Bars recorded per voice message (the bubble resamples them to its width). */
export const WAVEFORM_BARS = 48;
export const TICKET_BATCH_LIMIT = 20;

export const AUDIO_EXTENSIONS = ['m4a', 'mp4', 'aac', 'mp3', 'ogg', 'oga', 'opus', 'wav'] as const;
