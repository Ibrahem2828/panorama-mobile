import {
  needsNewSession,
  parseExpiry,
  shouldRetryWithNewSession,
  MIN_FORCED_REFRESH_AGE_MS,
  type ViewerSession,
} from './logic';
import type { PageKind, ViewerSessionPayload } from './types';

/** Transport behind the viewer, injected so the session logic is unit tested without a network. */
export type ViewerSessionDeps = {
  createSession(): Promise<ViewerSessionPayload>;
  now(): number;
};

/**
 * Owns one viewer session: issues it lazily, renews it before expiry/exhaustion and after a failure, and
 * de-duplicates concurrent renewals. Pure: no React, no network (see `ViewerSessionDeps`).
 */
export class ViewerSessionManager {
  private session: ViewerSession | null = null;
  private inflight: Promise<ViewerSession> | null = null;
  /** Incremented on every renewal (observable by tests / UI). */
  renewals = 0;

  constructor(private readonly deps: ViewerSessionDeps) {}

  get current(): ViewerSession | null {
    return this.session;
  }

  reset() {
    this.session = null;
    this.inflight = null;
  }

  /** True when the next page-class request must be preceded by `ensure()`. */
  needsRenewal(): boolean {
    return needsNewSession(this.session, this.deps.now());
  }

  private acquire(force: boolean, staleToken?: string): Promise<ViewerSession> {
    if (this.inflight) return this.inflight;
    const now = this.deps.now();
    if (!force && !needsNewSession(this.session, now)) return Promise.resolve(this.session!);
    // Another request already renewed the session this one was sent with: just use the new one.
    if (
      force &&
      this.session &&
      staleToken &&
      this.session.token !== staleToken &&
      !needsNewSession(this.session, now)
    ) {
      return Promise.resolve(this.session);
    }
    const promise: Promise<ViewerSession> = this.deps
      .createSession()
      .then((payload) => {
        const next: ViewerSession = {
          token: payload.session_token,
          expiresAt: parseExpiry(payload.expires_at),
          issuedAt: this.deps.now(),
          used: 0,
        };
        this.session = next;
        this.renewals += 1;
        return next;
      })
      .finally(() => {
        if (this.inflight === promise) this.inflight = null;
      });
    this.inflight = promise;
    return promise;
  }

  /** Makes sure a valid session exists (issues or renews it when missing, expired or exhausted). */
  ensure(): Promise<ViewerSession> {
    return this.acquire(false);
  }

  /**
   * Synchronous: counts one page-class request against the current session and returns its token, or null when a new
   * session is needed first (call `ensure()` and try again).
   */
  consume(): string | null {
    if (this.needsRenewal() || !this.session) return null;
    this.session.used += 1;
    return this.session.token;
  }

  /**
   * An image failed to load with `token` (the native image loader does not tell us why). When that session is old
   * enough to have expired or been exhausted, renews it so the caller can retry once. Returns false when renewing
   * cannot help (fresh session) so the caller should show the error instead.
   */
  async renewAfterFailure(staleToken: string): Promise<boolean> {
    const session = this.session;
    if (session && session.token !== staleToken && !needsNewSession(session, this.deps.now())) {
      return true; // already renewed by a concurrent failure
    }
    if (session && this.deps.now() - session.issuedAt < MIN_FORCED_REFRESH_AGE_MS) return false;
    await this.acquire(true, staleToken);
    return true;
  }

  /** Runs a page-class request with a valid session; a 404 is retried exactly once with a renewed session. */
  async run<T>(kind: PageKind | 'text', call: (token: string) => Promise<T>): Promise<T> {
    const session = await this.acquire(false);
    session.used += 1;
    try {
      return await call(session.token);
    } catch (error) {
      if (!shouldRetryWithNewSession(error, kind, session, this.deps.now())) throw error;
      const renewed = await this.acquire(true, session.token);
      renewed.used += 1;
      return call(renewed.token);
    }
  }
}
