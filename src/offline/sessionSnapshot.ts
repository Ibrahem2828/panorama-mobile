import { getCacheStorage } from './cacheStorage';

/**
 * The last signed-in user, kept so the app can reach its home screen on a cold start without a connection. It holds the same
 * profile fields the app already shows (never a token: those stay in the secure store) and is removed on sign-out.
 */
const KEY = 'pano.offline.session.v1';

export type SessionSnapshot<TUser> = { user: TUser; savedAt: number };

export async function saveSessionSnapshot<TUser>(user: TUser): Promise<void> {
  try {
    await getCacheStorage().setItem(KEY, JSON.stringify({ user, savedAt: Date.now() }));
  } catch {
    // The snapshot only helps offline starts; failing to write it must never fail a sign-in.
  }
}

export async function loadSessionSnapshot<TUser>(): Promise<SessionSnapshot<TUser> | null> {
  try {
    const raw = await getCacheStorage().getItem(KEY);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<SessionSnapshot<TUser>>;

    return parsed.user && typeof parsed.savedAt === 'number'
      ? { user: parsed.user, savedAt: parsed.savedAt }
      : null;
  } catch {
    return null;
  }
}

export async function clearSessionSnapshot(): Promise<void> {
  try {
    await getCacheStorage().removeItem(KEY);
  } catch {
    // Nothing else to do.
  }
}
