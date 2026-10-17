import { buildConsentBody, missingConsents, parseConsentRequirements } from '../consent';

const current = {
  terms: { version: '2026-01', is_active: true, content_url: 'https://x.test/terms' },
  privacy: { version: '3', is_active: true },
};

describe('registration consent', () => {
  it('parses active published versions', () => {
    expect(parseConsentRequirements(current)).toEqual([
      { kind: 'terms', version: '2026-01', contentUrl: 'https://x.test/terms' },
      { kind: 'privacy', version: '3', contentUrl: null },
    ]);
  });

  it('ignores inactive, missing or malformed policies', () => {
    expect(parseConsentRequirements(null)).toEqual([]);
    expect(parseConsentRequirements({ terms: { version: '1', is_active: false } })).toEqual([]);
    expect(parseConsentRequirements({ terms: { version: '' }, privacy: 5 })).toEqual([]);
  });

  it('reports unchecked boxes', () => {
    const requirements = parseConsentRequirements(current);
    expect(missingConsents(requirements, { terms: true })).toEqual(['privacy']);
    expect(missingConsents(requirements, { terms: true, privacy: true })).toEqual([]);
    expect(missingConsents([], {})).toEqual([]);
  });

  it('builds the payload fields', () => {
    expect(buildConsentBody(parseConsentRequirements(current))).toEqual({
      accept_terms_version: '2026-01',
      accept_privacy_version: '3',
    });
    expect(buildConsentBody([])).toEqual({});
  });
});
