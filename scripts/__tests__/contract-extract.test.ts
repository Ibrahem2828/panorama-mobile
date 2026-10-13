/* eslint-disable @typescript-eslint/no-require-imports */
const {
  normalizePath,
  parseEndpoints,
  extractCalls,
  extractLiteralPrefixes,
  indexContract,
  compare,
} = require('../lib/contract-extract.cjs');

const ENDPOINTS_SRC = `
export const API_PREFIX = '/api/v1';
export const endpoints = {
  health: \`\${API_PREFIX}/health/\`,
  auth: {
    login: \`\${API_PREFIX}/auth/login/\`,
  },
  announcements: { list: \`\${API_PREFIX}/announcements/\` },
  groups: {
    detail: (groupId: EndpointId) => \`\${API_PREFIX}/groups/\${groupId}/\`,
    files: (groupId: EndpointId) =>
      \`\${API_PREFIX}/groups/\${groupId}/files/\`,
  },
} as const;
`;

const spec = {
  paths: {
    '/api/v1/health/': { get: {} },
    '/api/v1/auth/login/': { post: {} },
    '/api/v1/announcements/': { get: {} },
    '/api/v1/groups/{id}/': { get: {}, parameters: [] },
    '/api/v1/groups/{group_id}/files/': { get: {} },
    '/api/v1/protected-files/{token}/': { get: {} },
  },
};

describe('normalizePath', () => {
  it('collapses differently named params', () => {
    expect(normalizePath('/a/{group_id}/b/${groupId}/')).toBe('/a/{}/b/{}/');
  });
});

describe('parseEndpoints', () => {
  it('flattens nested groups, inline objects and builders', () => {
    expect(parseEndpoints(ENDPOINTS_SRC)).toEqual({
      health: '/api/v1/health/',
      'auth.login': '/api/v1/auth/login/',
      'announcements.list': '/api/v1/announcements/',
      'groups.detail': '/api/v1/groups/{groupId}/',
      'groups.files': '/api/v1/groups/{groupId}/files/',
    });
  });

  it('throws when the endpoints object is missing', () => {
    expect(() => parseEndpoints('const x = 1;')).toThrow();
  });
});

describe('extractCalls', () => {
  it('captures method and endpoint key across generics and line breaks', () => {
    const src = `
      apiClient.get<PaginatedResult<X>>(endpoints.groups.files(groupId), { authToken });
      return apiClient.post<A, B>(
        endpoints.auth.login,
        body,
      );
      apiClient.delete<unknown>(endpoints.groups.detail(id), {});
    `;
    expect(
      extractCalls(src, 'f.ts').map((c: { method: string; key: string }) => [c.method, c.key]),
    ).toEqual([
      ['GET', 'groups.files'],
      ['POST', 'auth.login'],
      ['DELETE', 'groups.detail'],
    ]);
  });
});

describe('extractLiteralPrefixes', () => {
  it('finds literal api prefixes but not templated ones', () => {
    const src = `a(['/api/v1/protected-files/']); b('/api/v1/$1'); c(\`/api/v1/\${x}\`)`;
    expect(extractLiteralPrefixes(src, 'f.ts').map((p: { path: string }) => p.path)).toEqual([
      '/api/v1/protected-files/',
    ]);
  });
});

describe('compare', () => {
  const endpoints = parseEndpoints(ENDPOINTS_SRC);
  const contractIndex = indexContract(spec);
  const call = (method: string, key: string) => ({ method, key, file: 'f.ts', line: 1 });

  it('accepts matching calls', () => {
    const r = compare({
      endpoints,
      calls: [
        call('GET', 'health'),
        call('POST', 'auth.login'),
        call('GET', 'announcements.list'),
        call('GET', 'groups.detail'),
        call('GET', 'groups.files'),
      ],
      contractIndex,
    });
    expect(r.problems).toEqual([]);
  });

  it('reports a method mismatch', () => {
    const r = compare({ endpoints, calls: [call('DELETE', 'groups.detail')], contractIndex });
    expect(r.problems.some((p: { type: string }) => p.type === 'method-mismatch')).toBe(true);
  });

  it('reports an unknown path and an unresolved key', () => {
    const idx = indexContract({ paths: {} });
    const r = compare({
      endpoints,
      calls: [call('GET', 'health'), call('GET', 'nope.missing')],
      contractIndex: idx,
    });
    const types = r.problems.map((p: { type: string }) => p.type);
    expect(types).toContain('unknown-path');
    expect(types).toContain('unresolved');
  });

  it('honours the allowlist and flags stale entries', () => {
    const idx = indexContract({ paths: { '/api/v1/health/': { post: {} } } });
    const allowlist = [
      { method: 'GET', path: '/api/v1/health/', reason: 'test' },
      { method: 'GET', path: '/api/v1/gone/', reason: 'stale' },
    ];
    const r = compare({
      endpoints: { health: '/api/v1/health/' },
      calls: [call('GET', 'health')],
      contractIndex: idx,
      allowlist,
    });
    expect(r.problems).toEqual([]);
    expect(r.staleAllowlist).toHaveLength(1);
  });

  it('checks literal prefixes against the contract', () => {
    const r = compare({
      endpoints: {},
      calls: [],
      prefixes: [
        { path: '/api/v1/protected-files/', file: 'f.ts', line: 1 },
        { path: '/api/v1/bogus/', file: 'f.ts', line: 2 },
      ],
      contractIndex,
    });
    expect(r.problems).toHaveLength(1);
    expect(r.problems[0].type).toBe('unknown-prefix');
  });
});
