jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { extra: { apiBaseUrl: 'https://api.example.com' } } },
}));

import { ApiClientError } from '../errors';
import {
  acquireIdempotencyKey,
  generateIdempotencyKey,
  resetIdempotencyKeys,
  runIdempotentAction,
} from '../idempotency';

beforeEach(() => resetIdempotencyKeys());

function apiError(code: ApiClientError['code'], status?: number) {
  return new ApiClientError({ code, status, message: 'boom' });
}

describe('generateIdempotencyKey', () => {
  it('produces distinct RFC 4122 v4 uuids', () => {
    const first = generateIdempotencyKey();
    const second = generateIdempotencyKey();

    expect(first).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u);
    expect(first).not.toBe(second);
  });

  it('falls back to Math.random when crypto.randomUUID is unavailable', () => {
    const original = (globalThis as { crypto?: unknown }).crypto;

    Object.defineProperty(globalThis, 'crypto', { value: undefined, configurable: true });
    try {
      expect(generateIdempotencyKey()).toMatch(/^[0-9a-f-]{36}$/u);
    } finally {
      Object.defineProperty(globalThis, 'crypto', { value: original, configurable: true });
    }
  });
});

describe('runIdempotentAction', () => {
  it('re-uses ONE key when the same action is retried after a transient failure', async () => {
    const keys: string[] = [];
    const action = jest
      .fn<Promise<string>, [string]>()
      .mockImplementationOnce(async (key) => {
        keys.push(key);
        throw apiError('NETWORK_ERROR');
      })
      .mockImplementationOnce(async (key) => {
        keys.push(key);
        throw apiError('SERVER_ERROR', 502);
      })
      .mockImplementationOnce(async (key) => {
        keys.push(key);
        return 'done';
      });
    const payload = { items: [1] };

    await expect(runIdempotentAction('order', payload, action)).rejects.toBeInstanceOf(
      ApiClientError,
    );
    await expect(runIdempotentAction('order', { items: [1] }, action)).rejects.toBeInstanceOf(
      ApiClientError,
    );
    await expect(runIdempotentAction('order', payload, action)).resolves.toBe('done');

    expect(new Set(keys).size).toBe(1);
  });

  it('starts a new action (new key) after success', async () => {
    const keys: string[] = [];
    const action = async (key: string) => {
      keys.push(key);
      return 'ok';
    };

    await runIdempotentAction('order', { a: 1 }, action);
    await runIdempotentAction('order', { a: 1 }, action);

    expect(keys[0]).not.toBe(keys[1]);
  });

  it('uses a new key when the payload changes', () => {
    const first = acquireIdempotencyKey('order', { copies: 1 });
    const second = acquireIdempotencyKey('order', { copies: 2 });

    expect(first).not.toBe(second);
  });

  it('releases the key after a definitive 4xx so a corrected retry is a fresh action', async () => {
    const keys: string[] = [];
    const action = async (key: string) => {
      keys.push(key);
      throw apiError('VALIDATION_ERROR', 400);
    };

    await expect(runIdempotentAction('order', { a: 1 }, action)).rejects.toBeDefined();
    await expect(runIdempotentAction('order', { a: 1 }, action)).rejects.toBeDefined();

    expect(keys[0]).not.toBe(keys[1]);
  });

  it('mints a new key and raises a friendly error on IDEMPOTENCY_KEY_REUSED', async () => {
    const keys: string[] = [];
    const action = async (key: string) => {
      keys.push(key);
      throw apiError('IDEMPOTENCY_KEY_REUSED', 409);
    };

    await expect(runIdempotentAction('order', { a: 1 }, action)).rejects.toMatchObject({
      code: 'IDEMPOTENCY_KEY_REUSED',
      status: 409,
      message: expect.stringMatching(/\S/u),
    });
    await expect(runIdempotentAction('order', { a: 1 }, action)).rejects.toBeDefined();

    expect(keys[0]).not.toBe(keys[1]);
  });

  it('keeps the key while the server reports the action as in progress', async () => {
    const keys: string[] = [];
    const action = async (key: string) => {
      keys.push(key);
      throw apiError('IDEMPOTENCY_IN_PROGRESS', 409);
    };

    await expect(runIdempotentAction('order', { a: 1 }, action)).rejects.toBeDefined();
    await expect(runIdempotentAction('order', { a: 1 }, action)).rejects.toBeDefined();

    expect(keys[0]).toBe(keys[1]);
  });
});
