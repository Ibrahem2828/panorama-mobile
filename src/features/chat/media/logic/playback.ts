export const PLAYBACK_SPEEDS = [1, 1.5, 2] as const;
export type PlaybackSpeed = (typeof PLAYBACK_SPEEDS)[number];

export function nextSpeed(current: number): PlaybackSpeed {
  const index = PLAYBACK_SPEEDS.findIndex((speed) => speed === current);

  return PLAYBACK_SPEEDS[(index + 1) % PLAYBACK_SPEEDS.length] ?? 1;
}

type Stopper = () => void;

/**
 * Only one audio message plays at a time (like WhatsApp): a player that starts claims the slot and the previous owner is
 * stopped. Leaving the chat releases everything.
 */
export class PlaybackRegistry {
  private active: { id: string; stop: Stopper } | null = null;

  claim(id: string, stop: Stopper): void {
    if (this.active && this.active.id !== id) {
      this.active.stop();
    }

    this.active = { id, stop };
  }

  release(id: string): void {
    if (this.active?.id === id) {
      this.active = null;
    }
  }

  stopAll(): void {
    const current = this.active;

    this.active = null;
    current?.stop();
  }

  get activeId(): string | null {
    return this.active?.id ?? null;
  }
}

export const playbackRegistry = new PlaybackRegistry();

/** Fraction of the clip played, in [0, 1]. `durationSec` 0 (unknown) gives 0. */
export function progressFraction(positionSec: number, durationSec: number): number {
  return durationSec > 0 ? Math.min(1, Math.max(0, positionSec / durationSec)) : 0;
}

/** Maps a touch inside the waveform (0..width) to a position in seconds (RTL flips the direction). */
export function seekPosition(
  touchX: number,
  width: number,
  durationSec: number,
  rtl: boolean,
): number {
  if (width <= 0 || durationSec <= 0) {
    return 0;
  }

  const ratio = Math.min(1, Math.max(0, touchX / width));

  return (rtl ? 1 - ratio : ratio) * durationSec;
}
