/**
 * What may be kept for offline use. Only safe, user-owned GET responses of the data screens are cached, chosen from an
 * explicit allowlist; anything that carries a secret, a short-lived ticket, a protected page or a file is refused even if
 * a future allowlist entry would match it.
 */

const ALLOW: readonly RegExp[] = [
  /^\/api\/v1\/auth\/me\/$/u,
  /^\/api\/v1\/students\/me\/profile\/$/u,
  /^\/api\/v1\/(?:universities|academic-years|semesters)\/$/u,
  // The current semester is read-only reference data the home and subjects screens need offline too.
  /^\/api\/v1\/academic\/current-term\/$/u,
  /^\/api\/v1\/universities\/\d+\/faculties\/$/u,
  /^\/api\/v1\/(?:faculties|majors)\/\d+\/(?:majors|subjects)\/$/u,
  /^\/api\/v1\/verification\/me\/$/u,
  /^\/api\/v1\/policies\/(?:current|status)\/$/u,
  /^\/api\/v1\/announcements\/(?:\d+\/)?$/u,
  /^\/api\/v1\/groups\/my\/$/u,
  // The read-only subject catalogue and one subject's details (course description). Only ever read, never a POST.
  /^\/api\/v1\/subjects\/(?:\d+\/)?$/u,
  /^\/api\/v1\/groups\/\d+\/(?:files|messages)?\/?$/u,
  /^\/api\/v1\/chat\/unread\/$/u,
  /^\/api\/v1\/chat\/preferences\/$/u,
  /^\/api\/v1\/enrollment\/requests\/$/u,
  /^\/api\/v1\/files\/(?:\d+\/)?$/u,
  /^\/api\/v1\/files\/\d+\/viewer\/manifest\/$/u,
  /^\/api\/v1\/printing\/(?:options|products|pickup-locations)\/$/u,
  /^\/api\/v1\/printing\/orders\/my\/(?:\d+\/)?$/u,
  /^\/api\/v1\/notifications\/(?:unread-count|summary|preferences)?\/?$/u,
  /^\/api\/v1\/support\/tickets\/(?:my|\d+)\/$/u,
  /^\/api\/v1\/lectures\/(?:\d+\/)?$/u,
  /^\/api\/v1\/lectures\/\d+\/notes\/$/u,
  /^\/api\/v1\/my-notes\/$/u,
  /^\/api\/v1\/annotations\/(?:lectures|files)\/\d+\/$/u,
  /^\/api\/v1\/feedback\/mine\/$/u,
  /^\/api\/v1\/search\/$/u,
];

const NEVER: readonly RegExp[] = [
  /ticket/iu,
  /token/iu,
  /whatsapp/iu,
  /password/iu,
  /otp/iu,
  /\/viewer\/(?:session|pages)\//u,
  /processing-status/u,
  /protected/iu,
  /download/iu,
  /\/auth\/(?!me\/)/u,
  /account\/deletion/u,
];

/** `path` is the request path without the query string. */
export function isCacheablePath(path: string): boolean {
  const clean = path.split('?')[0] ?? path;

  // The notification-list pattern also matches `/notifications//`: normalise doubled slashes first.
  const normalised = clean.replace(/\/{2,}/gu, '/');

  // `support/tickets/my/` contains the word "ticket" on purpose: it is a list of the user's own tickets, not an access
  // ticket, so it is checked against the allowlist before the guard (the guard still blocks `*-ticket` endpoints).
  if (/^\/api\/v1\/support\/tickets\/(?:my|\d+)\/$/u.test(normalised)) {
    return true;
  }

  if (NEVER.some((pattern) => pattern.test(normalised))) {
    return false;
  }

  return ALLOW.some((pattern) => pattern.test(normalised));
}

/** Stable key: path plus the query sorted by name, so parameter order never splits an entry. */
export function buildCacheKey(
  path: string,
  query?: Record<string, string | number | boolean | null | undefined>,
): string {
  const base = (path.split('?')[0] ?? path).replace(/\/{2,}/gu, '/');
  const pairs = Object.entries(query ?? {})
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([name, value]) => `${name}=${String(value)}`)
    .sort();

  return pairs.length > 0 ? `${base}?${pairs.join('&')}` : base;
}
