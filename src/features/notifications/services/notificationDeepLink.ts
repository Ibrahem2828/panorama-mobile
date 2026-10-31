import type { NotificationRouteIntent } from '../types';

const MAX_DEEP_LINK_LENGTH = 255;
const APP_SCHEME = 'panorama:';
const PLACEHOLDER_ORIGIN = 'http://deep-link.invalid';

type Matcher = {
  pattern: RegExp;
  build: (ids: string[]) => NotificationRouteIntent;
};

/**
 * Paths the backend may send (the same table the web app understands, locale prefix stripped)
 * and the screen each one opens here. Anything that is not on this list is ignored, never
 * opened. Paths with no matching screen in the app map to the closest list screen.
 */
const MATCHERS: readonly Matcher[] = [
  { pattern: /^\/home$/u, build: () => ({ kind: 'home' }) },
  { pattern: /^\/notifications$/u, build: () => ({ kind: 'notifications' }) },
  { pattern: /^\/announcements$/u, build: () => ({ kind: 'announcements' }) },
  {
    pattern: /^\/announcements\/(\d{1,12})$/u,
    build: ([id]) => ({ kind: 'announcement', announcementId: id as string }),
  },
  { pattern: /^\/printing$/u, build: () => ({ kind: 'printingHome' }) },
  { pattern: /^\/printing\/new$/u, build: () => ({ kind: 'printingNew' }) },
  { pattern: /^\/printing\/orders$/u, build: () => ({ kind: 'printingOrders' }) },
  {
    pattern: /^\/printing\/orders\/(\d{1,12})$/u,
    build: ([id]) => ({ kind: 'printingOrder', orderId: id as string }),
  },
  { pattern: /^\/groups$/u, build: () => ({ kind: 'groups' }) },
  // Students no longer browse or request groups: the old "available groups" link lands on their own groups.
  { pattern: /^\/groups\/(?:my|available)$/u, build: () => ({ kind: 'myGroups' }) },
  {
    pattern: /^\/groups\/(\d{1,12})$/u,
    build: ([id]) => ({ kind: 'group', groupId: id as string }),
  },
  {
    pattern: /^\/groups\/(\d{1,12})\/chat$/u,
    build: ([id]) => ({ kind: 'groupChat', groupId: id as string }),
  },
  {
    pattern: /^\/groups\/(\d{1,12})\/files$/u,
    build: ([id]) => ({ kind: 'groupFiles', groupId: id as string }),
  },
  { pattern: /^\/files$/u, build: () => ({ kind: 'files' }) },
  { pattern: /^\/files\/(\d{1,12})$/u, build: ([id]) => ({ kind: 'file', fileId: id as string }) },
  { pattern: /^\/subjects$/u, build: () => ({ kind: 'subjects' }) },
  {
    pattern: /^\/subjects\/(\d{1,12})$/u,
    build: ([id]) => ({ kind: 'subject', subjectId: id as string }),
  },
  { pattern: /^\/support$/u, build: () => ({ kind: 'supportList' }) },
  { pattern: /^\/support\/new$/u, build: () => ({ kind: 'supportNew' }) },
  {
    pattern: /^\/support\/(\d{1,12})$/u,
    build: ([id]) => ({ kind: 'supportTicket', ticketId: id as string }),
  },
  { pattern: /^\/feedback(\/mine|\/suggestions)?$/u, build: () => ({ kind: 'feedback' }) },
  { pattern: /^\/profile$/u, build: () => ({ kind: 'profile' }) },
  { pattern: /^\/profile\/edit$/u, build: () => ({ kind: 'editProfile' }) },
  { pattern: /^\/profile\/academic$/u, build: () => ({ kind: 'academicInfo' }) },
  { pattern: /^\/profile\/settings$/u, build: () => ({ kind: 'settings' }) },
  { pattern: /^\/search$/u, build: () => ({ kind: 'search' }) },
];

/**
 * Reduces a backend `deep_link` to an app path. Accepts a relative path or a `panorama://`
 * link; other origins, protocol-relative links, `javascript:`, backslashes, control
 * characters, percent-encoding, dot segments and unknown routes all yield null.
 */
export function normalizeDeepLinkPath(raw: string | null | undefined): string | null {
  if (typeof raw !== 'string') {
    return null;
  }

  const value = raw.trim();

  if (
    !value ||
    value.length > MAX_DEEP_LINK_LENGTH ||
    // eslint-disable-next-line no-control-regex
    /[\u0000-\u001f\u007f\\]/u.test(value) ||
    value.startsWith('//') ||
    // Dot segments are checked on the raw text: URL parsing would silently resolve them.
    /(^|\/)\.{1,2}(\/|$|[?#])/u.test(value)
  ) {
    return null;
  }

  let pathname: string;

  try {
    if (value.startsWith('/')) {
      const parsed = new URL(value, PLACEHOLDER_ORIGIN);

      if (parsed.origin !== PLACEHOLDER_ORIGIN) {
        return null;
      }

      pathname = parsed.pathname;
    } else if (value.toLowerCase().startsWith(`${APP_SCHEME}//`)) {
      // panorama://printing/orders/4 -> /printing/orders/4
      const rest = value.slice(APP_SCHEME.length + 2).split(/[?#]/u)[0] ?? '';

      pathname = `/${rest}`;
    } else {
      return null;
    }
  } catch {
    return null;
  }

  if (/%|\/\.{1,2}(\/|$)/u.test(pathname)) {
    return null;
  }

  const withoutLocale = pathname.replace(/^\/(ar|en)(?=\/|$)/u, '') || '/';

  return withoutLocale.length > 1 ? withoutLocale.replace(/\/+$/u, '') : withoutLocale;
}

/** The screen a backend deep link opens, or null when the link is not one we follow. */
export function parseDeepLink(raw: string | null | undefined): NotificationRouteIntent | null {
  const path = normalizeDeepLinkPath(raw);

  if (!path) {
    return null;
  }

  for (const { pattern, build } of MATCHERS) {
    const match = pattern.exec(path);

    if (match) {
      return build(match.slice(1).filter((part): part is string => /^\d+$/u.test(part ?? '')));
    }
  }

  return null;
}
