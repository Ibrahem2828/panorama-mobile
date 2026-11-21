import { authenticatedImageUrl } from '../../../utils/authenticatedImageUrl';

/**
 * Pictures of the store (and of groups, announcements and print products) are authenticated API URLs; see
 * `authenticatedImageUrl` for the allowlist and the host-stripping that keeps the bearer token on our own API.
 */
export const storeImageUrl = authenticatedImageUrl;
