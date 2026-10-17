import {
  acceptanceBody,
  acceptanceSignature,
  normalizePolicyStatus,
  pendingFromStatus,
} from '../services/policyModel';

const item = (version: string, mustAccept: boolean) => ({
  version,
  content_url: `https://legal.example/${version}`,
  requires_reacceptance: true,
  published_at: '2026-05-01T00:00:00Z',
  accepted: !mustAccept,
  must_accept: mustAccept,
});

describe('normalizePolicyStatus', () => {
  it('maps the server status', () => {
    const status = normalizePolicyStatus({
      terms: item('2', true),
      privacy: item('1', false),
      must_accept_any: true,
    });

    expect(status.mustAcceptAny).toBe(true);
    expect(status.terms).toMatchObject({ version: '2', mustAccept: true });
    expect(status.privacy).toMatchObject({ accepted: true, mustAccept: false });
  });

  it('treats nothing published, null and junk as nothing to accept', () => {
    expect(normalizePolicyStatus({ terms: null, privacy: null }).mustAcceptAny).toBe(false);
    expect(normalizePolicyStatus(null).mustAcceptAny).toBe(false);
    expect(normalizePolicyStatus('x').terms).toBeNull();
    expect(normalizePolicyStatus({ terms: { version: '' } }).terms).toBeNull();
  });

  it('derives must-accept from an item when the flag is missing', () => {
    expect(normalizePolicyStatus({ privacy: item('3', true) }).mustAcceptAny).toBe(true);
  });
});

describe('pendingFromStatus', () => {
  it('lists only the kinds that must be accepted', () => {
    const pending = pendingFromStatus(
      normalizePolicyStatus({
        terms: item('2', true),
        privacy: item('1', false),
        must_accept_any: true,
      }),
    );

    expect(pending.map((entry) => entry.kind)).toEqual(['terms']);
  });

  it('is empty without a status or when nothing must be accepted', () => {
    expect(pendingFromStatus(null)).toEqual([]);
    expect(pendingFromStatus(normalizePolicyStatus({ terms: item('2', false) }))).toEqual([]);
  });
});

describe('acceptance request', () => {
  const pending = pendingFromStatus(
    normalizePolicyStatus({
      terms: item('2', true),
      privacy: item('5', true),
      must_accept_any: true,
    }),
  );

  it('sends the pending versions and the locale', () => {
    expect(acceptanceBody(pending, 'ar')).toEqual({
      terms_version: '2',
      privacy_version: '5',
      locale: 'ar',
    });
  });

  it('scopes the idempotency key to exactly what is accepted', () => {
    expect(acceptanceSignature(pending)).toBe('terms:2|privacy:5');
    expect(acceptanceSignature(pending.slice(0, 1))).toBe('terms:2');
  });
});
