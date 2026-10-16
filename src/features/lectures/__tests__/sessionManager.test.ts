import { createApiError } from '../../../api/errors';
import { SESSION_REQUEST_BUDGET } from '../logic';
import { ViewerSessionManager } from '../sessionManager';

function setup(ttlMs = 900_000) {
  let now = 1_000_000;
  let counter = 0;
  const createSession = jest.fn(async () => {
    counter += 1;
    return { session_token: `token-${counter}`, expires_at: new Date(now + ttlMs).toISOString() };
  });
  const manager = new ViewerSessionManager({ createSession, now: () => now });
  return {
    manager,
    createSession,
    advance: (ms: number) => {
      now += ms;
    },
  };
}

describe('ViewerSessionManager', () => {
  it('issues the session lazily and reuses it', async () => {
    const { manager, createSession } = setup();
    expect(manager.current).toBeNull();
    expect(manager.consume()).toBeNull();
    const first = await manager.ensure();
    const second = await manager.ensure();
    expect(first.token).toBe('token-1');
    expect(second).toBe(first);
    expect(createSession).toHaveBeenCalledTimes(1);
  });

  it('de-duplicates concurrent renewals', async () => {
    const { manager, createSession } = setup();
    const [a, b, c] = await Promise.all([manager.ensure(), manager.ensure(), manager.ensure()]);
    expect(a).toBe(b);
    expect(b).toBe(c);
    expect(createSession).toHaveBeenCalledTimes(1);
    expect(manager.renewals).toBe(1);
  });

  it('counts consumed requests and renews when the budget is exhausted', async () => {
    const { manager, createSession } = setup();
    await manager.ensure();
    for (let index = 0; index < SESSION_REQUEST_BUDGET; index += 1) {
      expect(manager.consume()).toBe('token-1');
    }
    expect(manager.needsRenewal()).toBe(true);
    expect(manager.consume()).toBeNull();
    const renewed = await manager.ensure();
    expect(renewed.token).toBe('token-2');
    expect(renewed.used).toBe(0);
    expect(createSession).toHaveBeenCalledTimes(2);
  });

  it('renews before the session expires', async () => {
    const { manager, advance } = setup(60_000);
    await manager.ensure();
    advance(20_000);
    expect(manager.needsRenewal()).toBe(false);
    advance(15_000); // inside the 30 s skew window
    expect(manager.needsRenewal()).toBe(true);
    expect((await manager.ensure()).token).toBe('token-2');
  });

  it('retries a page request once with a renewed session after a 404', async () => {
    const { manager, advance } = setup();
    await manager.ensure();
    advance(10_000);
    const call = jest
      .fn<Promise<string>, [string]>()
      .mockRejectedValueOnce(createApiError({ status: 404 }))
      .mockResolvedValueOnce('ok');
    await expect(manager.run('page', call)).resolves.toBe('ok');
    expect(call).toHaveBeenNthCalledWith(1, 'token-1');
    expect(call).toHaveBeenNthCalledWith(2, 'token-2');
    expect(manager.current?.used).toBe(1);
  });

  it('does not renew when a fresh session returns 404', async () => {
    const { manager, createSession } = setup();
    const call = jest.fn().mockRejectedValue(createApiError({ status: 404 }));
    await expect(manager.run('page', call)).rejects.toMatchObject({ status: 404 });
    expect(call).toHaveBeenCalledTimes(1);
    expect(createSession).toHaveBeenCalledTimes(1);
  });

  it('never renews for thumbnails and surfaces other errors untouched', async () => {
    const { manager, advance, createSession } = setup();
    await manager.ensure();
    advance(10_000);
    await expect(
      manager.run('thumbnail', jest.fn().mockRejectedValue(createApiError({ status: 404 }))),
    ).rejects.toMatchObject({ status: 404 });
    await expect(
      manager.run('page', jest.fn().mockRejectedValue(createApiError({ status: 500 }))),
    ).rejects.toMatchObject({ status: 500 });
    expect(createSession).toHaveBeenCalledTimes(1);
  });

  it('renews after an image failure only when the session is old enough', async () => {
    const { manager, advance, createSession } = setup();
    const first = await manager.ensure();
    expect(await manager.renewAfterFailure(first.token)).toBe(false);
    expect(createSession).toHaveBeenCalledTimes(1);
    advance(10_000);
    expect(await manager.renewAfterFailure(first.token)).toBe(true);
    expect(manager.current?.token).toBe('token-2');
    // A concurrent failure of the same stale token reuses the renewed session.
    expect(await manager.renewAfterFailure(first.token)).toBe(true);
    expect(createSession).toHaveBeenCalledTimes(2);
  });

  it('propagates session creation errors and recovers on the next call', async () => {
    const { manager, createSession } = setup();
    createSession.mockRejectedValueOnce(createApiError({ code: 'NETWORK_ERROR' }));
    await expect(manager.ensure()).rejects.toMatchObject({ code: 'NETWORK_ERROR' });
    expect((await manager.ensure()).token).toBe('token-1');
  });

  it('reset forgets the session', async () => {
    const { manager } = setup();
    await manager.ensure();
    manager.reset();
    expect(manager.current).toBeNull();
    expect(manager.needsRenewal()).toBe(true);
  });
});
