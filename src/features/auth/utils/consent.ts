/**
 * Registration consent, mirroring the web app: every active published terms / privacy version
 * needs an explicit checkbox, and its version is sent as `accept_terms_version` /
 * `accept_privacy_version`. Nothing published means nothing to show and nothing to send.
 */
export type ConsentKind = 'terms' | 'privacy';

export type ConsentRequirement = {
  kind: ConsentKind;
  version: string;
  contentUrl: string | null;
};

export type ConsentChecks = Partial<Record<ConsentKind, boolean>>;

export type ConsentBody = {
  accept_terms_version?: string;
  accept_privacy_version?: string;
};

/** Defensive parse of the public "current policies" response. */
export function parseConsentRequirements(data: unknown): ConsentRequirement[] {
  if (!data || typeof data !== 'object') return [];
  const source = data as Record<string, unknown>;
  const out: ConsentRequirement[] = [];

  for (const kind of ['terms', 'privacy'] as const) {
    const item = source[kind];
    if (!item || typeof item !== 'object') continue;
    const record = item as Record<string, unknown>;
    if (typeof record.version !== 'string' || !record.version) continue;
    if (record.is_active === false) continue;
    out.push({
      kind,
      version: record.version,
      contentUrl:
        typeof record.content_url === 'string' && record.content_url ? record.content_url : null,
    });
  }

  return out;
}

/** Kinds whose required checkbox is still unchecked. */
export function missingConsents(
  requirements: ConsentRequirement[],
  checks: ConsentChecks,
): ConsentKind[] {
  return requirements.filter((item) => checks[item.kind] !== true).map((item) => item.kind);
}

/** Registration body fields; empty when nothing is published. */
export function buildConsentBody(requirements: ConsentRequirement[]): ConsentBody {
  const body: ConsentBody = {};

  for (const item of requirements) {
    if (item.kind === 'terms') body.accept_terms_version = item.version;
    else body.accept_privacy_version = item.version;
  }

  return body;
}
