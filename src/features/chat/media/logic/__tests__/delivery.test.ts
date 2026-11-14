import {
  normalizeTicket,
  normalizeTicketBatch,
  planTicketBatches,
  TicketCache,
  type MediaTicket,
} from '../tickets';
import { backoffDelay, isRetryableStatus, withBackoff } from '../retry';
import {
  CACHE_MAX_AGE_MS,
  CACHE_MAX_ENTRY_BYTES,
  cacheKey,
  canStore,
  isFresh,
  planEviction,
  type CacheEntry,
} from '../cacheIndex';
import { MB } from '../limits';
import {
  clampTransform,
  doubleTapTransform,
  fitSize,
  identityTransform,
  pinchTransform,
} from '../zoom';
import { nextSpeed, PlaybackRegistry, progressFraction, seekPosition } from '../playback';

const NOW = 1_700_000_000_000;
const ticket = (id: number, over: Partial<MediaTicket> = {}): MediaTicket => ({
  messageId: id,
  previewUrl: `http://x/p/${id}/`,
  thumbUrl: null,
  expiresAt: NOW + 120_000,
  kind: 'image',
  mime: 'image/png',
  size: 10,
  etag: '"abc"',
  supportsRange: true,
  ...over,
});

describe('tickets', () => {
  it('normalises the server payload and rejects malformed rows', () => {
    const parsed = normalizeTicket(
      {
        message_id: 7,
        preview_url: 'http://x/api/v1/protected-chat-attachments/t/',
        thumb_url: 'http://x/api/v1/protected-chat-attachments/t/?variant=thumb',
        expires_at: new Date(NOW + 120_000).toISOString(),
        kind: 'image',
        etag: '"h"',
        supports_range: true,
      },
      NOW,
    );

    expect(parsed).toMatchObject({
      messageId: 7,
      expiresAt: NOW + 120_000,
      etag: '"h"',
      supportsRange: true,
    });
    expect(normalizeTicket({ message_id: 1 }, NOW)).toBeNull();
    expect(normalizeTicket(null, NOW)).toBeNull();
    expect(
      normalizeTicket({ message_id: 1, preview_url: 'u', expires_at: 'junk' }, NOW)?.expiresAt,
    ).toBe(NOW + 60_000);

    const body = { tickets: [{ message_id: 1, preview_url: 'u' }, { bad: true }], missing: [9] };

    expect(normalizeTicketBatch(body, NOW).tickets).toHaveLength(1);
    expect(normalizeTicketBatch({ data: body }, NOW).missing).toEqual([9]);
    expect(normalizeTicketBatch(undefined, NOW)).toEqual({ tickets: [], missing: [] });
  });

  it('TicketCache serves a live ticket a limited number of times', () => {
    const cache = new TicketCache();

    cache.put([ticket(1)]);

    for (let i = 0; i < 5; i += 1) {
      expect(cache.take(1, NOW)).not.toBeNull();
    }

    expect(cache.take(1, NOW)).toBeNull();
  });

  it('TicketCache drops nearly expired tickets, lets audio reuse longer, forgets refused ones', () => {
    const cache = new TicketCache();

    cache.put([
      ticket(1, { expiresAt: NOW + 10_000 }),
      ticket(2, { kind: 'voice', expiresAt: NOW + 600_000 }),
      ticket(3),
    ]);
    expect(cache.take(1, NOW)).toBeNull();

    for (let i = 0; i < 50; i += 1) {
      expect(cache.take(2, NOW)).not.toBeNull();
    }

    cache.invalidate(3);
    expect(cache.take(3, NOW)).toBeNull();
  });

  it('plans batches of at most 20 without duplicates or known ids', () => {
    const ids = Array.from({ length: 45 }, (_, i) => i + 1);
    const batches = planTicketBatches([...ids, 1, 2], (id) => id === 3);

    expect(batches.map((batch) => batch.length)).toEqual([20, 20, 4]);
    expect(batches.flat()).not.toContain(3);
  });
});

describe('retry with backoff', () => {
  const sleeps: number[] = [];
  const sleep = (ms: number) => {
    sleeps.push(ms);
    return Promise.resolve();
  };

  beforeEach(() => {
    sleeps.length = 0;
  });

  it('retries with growing delays and then succeeds', async () => {
    let calls = 0;
    const result = await withBackoff(
      async () => {
        calls += 1;

        if (calls < 3) throw new Error('boom');

        return 'ok';
      },
      { attempts: 3, sleep, random: () => 0.5 },
    );

    expect(result).toBe('ok');
    expect(sleeps).toEqual([400, 800]);
  });

  it('stops at once on a definitive error and rethrows after the last attempt', async () => {
    let calls = 0;

    await expect(
      withBackoff(
        async () => {
          calls += 1;
          throw new Error('forbidden');
        },
        { attempts: 3, sleep, shouldRetry: () => false },
      ),
    ).rejects.toThrow('forbidden');
    expect(calls).toBe(1);
    await expect(
      withBackoff(async () => Promise.reject(new Error('x')), { attempts: 2, sleep }),
    ).rejects.toThrow('x');
  });

  it('knows which statuses are retryable', () => {
    expect([undefined, 408, 429, 500, 503].every(isRetryableStatus)).toBe(true);
    expect([401, 403, 404, 410].some(isRetryableStatus)).toBe(false);
    expect(backoffDelay(10, 400, 4000, () => 0.5)).toBe(4000);
  });
});

describe('cache eviction helpers', () => {
  const entry = (id: number, size: number, lastAccess: number): CacheEntry => ({
    key: cacheKey('u1', id, 'full'),
    messageId: id,
    variant: 'full',
    size,
    etag: '"e"',
    mime: 'image/png',
    lastAccess,
  });

  it('evicts least recently used first, honours protection and age', () => {
    const entries = [
      entry(1, 40 * MB, NOW - 3000),
      entry(2, 40 * MB, NOW - 1000),
      entry(3, 40 * MB, NOW - 2000),
    ];

    expect(planEviction(entries, { now: NOW, maxBytes: 100 * MB })).toEqual([
      cacheKey('u1', 1, 'full'),
    ]);
    expect(
      planEviction(entries, { now: NOW, maxBytes: 50 * MB, protect: [cacheKey('u1', 1, 'full')] }),
    ).toEqual([cacheKey('u1', 3, 'full'), cacheKey('u1', 2, 'full')]);
    expect(planEviction([entry(1, 1, NOW - CACHE_MAX_AGE_MS - 1)], { now: NOW })).toHaveLength(1);
  });

  it('stores only reasonable sizes and compares etags', () => {
    expect(canStore(1)).toBe(true);
    expect(canStore(0)).toBe(false);
    expect(canStore(CACHE_MAX_ENTRY_BYTES + 1)).toBe(false);
    expect(isFresh(entry(1, 1, 1), '"e"')).toBe(true);
    expect(isFresh(entry(1, 1, 1), '"other"')).toBe(false);
    expect(isFresh({ ...entry(1, 1, 1), etag: null }, null)).toBe(false);
  });
});

describe('zoom geometry and playback helpers', () => {
  const container = { width: 400, height: 800 };

  it('fits, clamps panning and pinches around the focal point', () => {
    const fitted = fitSize({ width: 2000, height: 1000 }, container);

    expect(fitted).toEqual({ width: 400, height: 200 });
    expect(clampTransform({ scale: 1, x: 300, y: 300 }, fitted, container)).toEqual({
      scale: 1,
      x: 0,
      y: 0,
    });
    expect(clampTransform({ scale: 3, x: 999, y: 0 }, fitted, container).x).toBe(400);
    expect(clampTransform({ scale: 99, x: 0, y: 0 }, fitted, container).scale).toBe(5);

    const next = pinchTransform(identityTransform, 100, 200, { x: 50, y: 0 }, { x: 50, y: 0 });

    expect(next).toMatchObject({ scale: 2, x: -50 });
    expect(
      doubleTapTransform(doubleTapTransform(identityTransform, { x: 1, y: 1 }), { x: 0, y: 0 }),
    ).toEqual(identityTransform);
  });

  it('cycles speeds, plays one clip at a time and seeks (RTL flips)', () => {
    expect([nextSpeed(1), nextSpeed(1.5), nextSpeed(2)]).toEqual([1.5, 2, 1]);

    const registry = new PlaybackRegistry();
    const stopA = jest.fn();
    const stopB = jest.fn();

    registry.claim('a', stopA);
    registry.claim('b', stopB);
    expect(stopA).toHaveBeenCalledTimes(1);
    registry.claim('b', stopB);
    expect(stopB).not.toHaveBeenCalled();
    registry.stopAll();
    expect(stopB).toHaveBeenCalledTimes(1);
    expect(registry.activeId).toBeNull();
    expect(progressFraction(5, 10)).toBe(0.5);
    expect(progressFraction(5, 0)).toBe(0);
    expect(seekPosition(25, 100, 40, false)).toBe(10);
    expect(seekPosition(25, 100, 40, true)).toBe(30);
  });
});
