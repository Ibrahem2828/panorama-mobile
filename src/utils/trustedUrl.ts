import { env } from '../config/env';

export type TrustedUrlRule = {
  pathPrefixes: readonly string[];
  allowHttpInDevelopment?: boolean;
};

export function isTrustedBackendUrl(candidate: string, rule: TrustedUrlRule): boolean {
  try {
    const candidateUrl = new URL(candidate);
    const apiUrl = new URL(env.apiBaseUrl);
    const protocolAllowed =
      candidateUrl.protocol === 'https:' ||
      (env.isDevelopment &&
        rule.allowHttpInDevelopment === true &&
        candidateUrl.protocol === 'http:');

    if (!protocolAllowed || candidateUrl.origin !== apiUrl.origin) return false;
    return rule.pathPrefixes.some((prefix) => candidateUrl.pathname.startsWith(prefix));
  } catch {
    return false;
  }
}
