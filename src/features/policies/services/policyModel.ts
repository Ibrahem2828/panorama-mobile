export type PolicyKind = 'terms' | 'privacy';

export type PolicyStatusItem = {
  version: string;
  contentUrl: string | null;
  requiresReacceptance: boolean;
  publishedAt: string | null;
  accepted: boolean;
  mustAccept: boolean;
};

/** `GET /policies/status/`: the server's per-user truth about what must still be accepted. */
export type PolicyStatus = {
  terms: PolicyStatusItem | null;
  privacy: PolicyStatusItem | null;
  mustAcceptAny: boolean;
};

export type PendingPolicy = { kind: PolicyKind; policy: PolicyStatusItem };

function pickItem(value: unknown): PolicyStatusItem | null {
  if (!value || typeof value !== 'object') return null;

  const record = value as Record<string, unknown>;

  if (typeof record.version !== 'string' || !record.version) return null;

  return {
    version: record.version,
    contentUrl:
      typeof record.content_url === 'string' && record.content_url ? record.content_url : null,
    requiresReacceptance: record.requires_reacceptance === true,
    publishedAt: typeof record.published_at === 'string' ? record.published_at : null,
    accepted: record.accepted === true,
    mustAccept: record.must_accept === true,
  };
}

/** Defensive parse; absent sections (nothing published) never block the student. */
export function normalizePolicyStatus(data: unknown): PolicyStatus {
  const source = data && typeof data === 'object' ? (data as Record<string, unknown>) : {};
  const terms = pickItem(source.terms);
  const privacy = pickItem(source.privacy);

  return {
    terms,
    privacy,
    mustAcceptAny:
      source.must_accept_any === true || terms?.mustAccept === true || privacy?.mustAccept === true,
  };
}

/** The kinds the server says this user must accept now. */
export function pendingFromStatus(status: PolicyStatus | null | undefined): PendingPolicy[] {
  if (!status || !status.mustAcceptAny) return [];

  const pending: PendingPolicy[] = [];

  for (const kind of ['terms', 'privacy'] as const) {
    const policy = status[kind];

    if (policy && policy.mustAccept) pending.push({ kind, policy });
  }

  return pending;
}

export function acceptanceBody(
  pending: PendingPolicy[],
  locale: 'ar' | 'en',
): { terms_version?: string; privacy_version?: string; locale: 'ar' | 'en' } {
  const body: { terms_version?: string; privacy_version?: string; locale: 'ar' | 'en' } = {
    locale,
  };

  for (const { kind, policy } of pending) {
    if (kind === 'terms') body.terms_version = policy.version;
    else body.privacy_version = policy.version;
  }

  return body;
}

/** Stable text for what is being accepted; scopes the idempotency key. */
export function acceptanceSignature(pending: PendingPolicy[]): string {
  return pending.map(({ kind, policy }) => `${kind}:${policy.version}`).join('|');
}
