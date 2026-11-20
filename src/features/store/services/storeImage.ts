import { buildApiUrl } from '../../../config/env';

/** `/api/v1/store/images/12/?v=..&variant=thumb` or `/api/v1/store/brands/3/logo/?v=..`, optionally with a host in front. */
const STORE_IMAGE_PATH =
  /^(?:https?:\/\/[^/?#\s]+)?(\/api\/v1\/store\/(?:images\/\d+|brands\/\d+\/logo)\/(?:\?[^#\s]*)?)$/u;

/**
 * Pictures of the store are authenticated API URLs. The host the server wrote into the payload is dropped and the path
 * is joined to the app's own API address, so the bearer token only ever goes to the API we are configured for. Anything
 * that is not a store picture path yields null (the caller shows the fallback and sends no token).
 */
export function storeImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  const match = STORE_IMAGE_PATH.exec(url.trim());

  return match?.[1] ? buildApiUrl(match[1]) : null;
}
