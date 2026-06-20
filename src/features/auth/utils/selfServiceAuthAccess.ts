import { env } from '../../../config/env';

export function isSelfServiceAuthEnabled(): boolean {
  return env.enableSelfServiceAuth;
}
