import { WAVEFORM_BARS, WAVEFORM_MAX_VALUES } from './limits';

/** Quietest level the meter reports (dBFS) that still counts as sound. */
const FLOOR_DB = -60;

/** expo-audio metering is dBFS (0 = loudest, about -160 = silence). Returns a perceptual level in [0, 1]. */
export function meteringToLevel(db: number | null | undefined): number {
  if (typeof db !== 'number' || !Number.isFinite(db)) {
    return 0;
  }

  const linear = Math.min(1, Math.max(0, (db - FLOOR_DB) / -FLOOR_DB));

  return Math.pow(linear, 1.6);
}

/**
 * Reduces the level samples taken while recording to `bars` values in 0..255 (what the server stores for the bubble).
 * Each bar is the peak of its slice; the whole shape is scaled so the loudest bar is full height, except a nearly
 * silent recording, which is not amplified into noise.
 */
export function buildWaveform(levels: readonly number[], bars: number = WAVEFORM_BARS): number[] {
  const count = Math.max(1, Math.min(WAVEFORM_MAX_VALUES, Math.floor(bars)));

  if (levels.length === 0) {
    return [];
  }

  const peaks: number[] = [];

  for (let index = 0; index < count; index += 1) {
    const from = Math.floor((index * levels.length) / count);
    const to = Math.max(from + 1, Math.floor(((index + 1) * levels.length) / count));
    let peak = 0;

    for (let cursor = from; cursor < Math.min(to, levels.length); cursor += 1) {
      peak = Math.max(peak, levels[cursor] ?? 0);
    }

    peaks.push(peak);
  }

  const loudest = Math.max(...peaks);
  const scale = Math.max(loudest, 0.25);

  return peaks.map((peak) => Math.max(0, Math.min(255, Math.round((peak / scale) * 255))));
}

export function isValidWaveform(value: unknown): value is number[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.length <= WAVEFORM_MAX_VALUES &&
    value.every((entry) => Number.isInteger(entry) && entry >= 0 && entry <= 255)
  );
}

/** Multipart value for the `waveform` field: a JSON array string, or null when there is nothing valid to send. */
export function serializeWaveform(values: readonly number[]): string | null {
  return isValidWaveform(values) ? JSON.stringify(values) : null;
}

/** Lenient parse of the server's `attachment_meta.waveform` (a list, or a JSON string of one). */
export function parseWaveform(value: unknown): number[] | null {
  let candidate: unknown = value;

  if (typeof value === 'string') {
    try {
      candidate = JSON.parse(value) as unknown;
    } catch {
      return null;
    }
  }

  return isValidWaveform(candidate) ? candidate : null;
}

/** Resamples stored bars to the number of bars that fit the bubble (nearest-peak), always at least one. */
export function resampleWaveform(values: readonly number[] | null, bars: number): number[] {
  const count = Math.max(1, Math.floor(bars));

  if (!values || values.length === 0) {
    return Array.from({ length: count }, () => 40);
  }

  return Array.from({ length: count }, (_, index) => {
    const from = Math.floor((index * values.length) / count);
    const to = Math.max(from + 1, Math.floor(((index + 1) * values.length) / count));
    let peak = 0;

    for (let cursor = from; cursor < Math.min(to, values.length); cursor += 1) {
      peak = Math.max(peak, values[cursor] ?? 0);
    }

    return peak;
  });
}
