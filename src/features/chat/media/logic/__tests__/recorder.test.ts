import {
  buildWaveform,
  isValidWaveform,
  meteringToLevel,
  parseWaveform,
  resampleWaveform,
  serializeWaveform,
} from '../waveform';
import {
  formatClock,
  initialRecorderState,
  isNearLimit,
  recorderReducer,
  remainingMs,
  type RecorderEvent,
  type RecorderState,
} from '../recorder';
import { VOICE_MAX_MS, VOICE_MIN_MS } from '../limits';

const clip = (durationMs: number) => ({ uri: 'file:///c.m4a', durationMs, levels: [0.2] });
const run = (events: RecorderEvent[], from: RecorderState = initialRecorderState) =>
  events.reduce(recorderReducer, from);
const recording = () =>
  run([
    { type: 'start' },
    { type: 'permission', granted: true, canAskAgain: true },
    { type: 'started' },
  ]);

describe('meteringToLevel / buildWaveform', () => {
  it('maps dBFS to a 0..1 level and ignores bad input', () => {
    expect(meteringToLevel(0)).toBe(1);
    expect(meteringToLevel(-160)).toBe(0);
    expect(meteringToLevel(undefined)).toBe(0);
    expect(meteringToLevel(Number.NaN)).toBe(0);
    expect(meteringToLevel(-20)).toBeGreaterThan(meteringToLevel(-40));
  });

  it('builds 48 integer bars within 0..255 with the loudest at full height', () => {
    const bars = buildWaveform(Array.from({ length: 1000 }, (_, i) => (i % 100) / 100));

    expect(buildWaveform([])).toEqual([]);
    expect(bars).toHaveLength(48);
    expect(bars.every((bar) => Number.isInteger(bar) && bar >= 0 && bar <= 255)).toBe(true);
    expect(Math.max(...bars)).toBe(255);
    expect(buildWaveform([0.5, 1])).toHaveLength(48);
    expect(Math.max(...buildWaveform([0.01, 0.02, 0.01]))).toBeLessThan(40);
    expect(buildWaveform([1, 1, 1], 500)).toHaveLength(128);
  });

  it('serialises, parses and resamples the wire format', () => {
    expect(serializeWaveform([3, 40, 255])).toBe('[3,40,255]');
    expect(serializeWaveform([])).toBeNull();
    expect(serializeWaveform([256])).toBeNull();
    expect(serializeWaveform([1.5])).toBeNull();
    expect(isValidWaveform(Array.from({ length: 129 }, () => 1))).toBe(false);
    expect(parseWaveform('[1,2]')).toEqual([1, 2]);
    expect(parseWaveform('nope')).toBeNull();
    expect(resampleWaveform([10, 200, 30, 40], 2)).toEqual([200, 40]);
    expect(resampleWaveform(null, 3)).toHaveLength(3);
  });
});

describe('recorder permissions', () => {
  it('goes idle -> requesting -> recording', () => {
    expect(run([{ type: 'start' }]).phase).toBe('requesting');
    expect(recording().phase).toBe('recording');
  });

  it('shows the denied state and allows trying again', () => {
    const denied = run([
      { type: 'start' },
      { type: 'permission', granted: false, canAskAgain: false },
    ]);

    expect(denied).toMatchObject({ phase: 'denied', canAskAgain: false });
    expect(run([{ type: 'start' }], denied).phase).toBe('requesting');
  });

  it('ignores events that do not belong to the phase', () => {
    expect(run([{ type: 'tick', elapsedMs: 1000, level: 1 }]).phase).toBe('idle');
    expect(run([{ type: 'stop', intent: 'send' }]).phase).toBe('idle');
    expect(run([{ type: 'started' }]).phase).toBe('idle');
  });
});

describe('recorder stop, cancel and the 5 minute cap', () => {
  it('tracks time and level', () => {
    expect(run([{ type: 'tick', elapsedMs: 4200, level: 0.7 }], recording())).toMatchObject({
      phase: 'recording',
      elapsedMs: 4200,
      level: 0.7,
    });
  });

  it('sends a clip of at least the minimum length, discards a shorter one', () => {
    const sent = run(
      [
        { type: 'stop', intent: 'send' },
        { type: 'finished', clip: clip(5000) },
      ],
      recording(),
    );
    const tooShort = run(
      [
        { type: 'stop', intent: 'send' },
        { type: 'finished', clip: clip(VOICE_MIN_MS - 1) },
      ],
      recording(),
    );

    expect(sent.clip?.durationMs).toBe(5000);
    expect(tooShort).toMatchObject({ clip: null, notice: 'tooShort' });
  });

  it('cancel throws the clip away silently', () => {
    expect(
      run(
        [
          { type: 'stop', intent: 'cancel' },
          { type: 'finished', clip: clip(9000) },
        ],
        recording(),
      ),
    ).toEqual(initialRecorderState);
  });

  it('stops by itself at exactly 300 s and keeps the clip for review', () => {
    const stopping = run([{ type: 'tick', elapsedMs: VOICE_MAX_MS, level: 0.5 }], recording());

    expect(stopping).toMatchObject({ phase: 'stopping', intent: 'limit', elapsedMs: VOICE_MAX_MS });

    const review = run([{ type: 'finished', clip: clip(VOICE_MAX_MS) }], stopping);

    expect(review).toMatchObject({ phase: 'review', notice: 'limitReached' });
    expect(review.clip?.durationMs).toBe(VOICE_MAX_MS);
  });

  it('never reports more than the cap even if a tick overshoots', () => {
    const state = run([{ type: 'tick', elapsedMs: VOICE_MAX_MS + 900, level: 1 }], recording());

    expect(state).toMatchObject({ elapsedMs: VOICE_MAX_MS, phase: 'stopping' });
  });

  it('a failure returns to idle with a dismissible notice', () => {
    const failed = run([{ type: 'failed' }], recording());

    expect(failed).toMatchObject({ phase: 'idle', notice: 'failed' });
    expect(run([{ type: 'dismissNotice' }], failed).notice).toBeNull();
  });

  it('formats the clock and the remaining time', () => {
    expect(formatClock(7000)).toBe('0:07');
    expect(formatClock(125_000)).toBe('2:05');
    expect(formatClock(-5)).toBe('0:00');
    expect(remainingMs(290_000)).toBe(10_000);
    expect(remainingMs(VOICE_MAX_MS + 10)).toBe(0);
    expect(isNearLimit(269_999)).toBe(false);
    expect(isNearLimit(270_000)).toBe(true);
  });
});
