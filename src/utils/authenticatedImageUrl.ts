import { buildApiUrl } from '../config/env';

/**
 * Pictures the API serves only to signed-in users (`?v=` is the cache-buster, `variant=thumb` the small store file):
 * store images and brand logos, group, announcement and ready-product (print products) images. A host in front is
 * accepted but dropped by `authenticatedImageUrl`.
 */
const AUTHENTICATED_IMAGE_PATH =
  /^(?:https?:\/\/[^/?#\s]+)?(\/api\/v1\/(?:store\/(?:images\/\d+|brands\/\d+\/logo)|groups\/\d+\/image|announcements\/\d+\/image|printing\/products\/\d+\/image)\/(?:\?[^#\s]*)?)$/u;

/**
 * The host the server wrote into the payload is dropped and the path is joined to the app's own API address, so the
 * bearer token only ever goes to the API we are configured for. Anything that is not an allowlisted picture path yields
 * null (the caller shows its fallback and sends no token).
 */
export function authenticatedImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  const match = AUTHENTICATED_IMAGE_PATH.exec(url.trim());

  return match?.[1] ? buildApiUrl(match[1]) : null;
}
