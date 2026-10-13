'use strict';
// Static extraction + comparison helpers for scripts/contract-check.mjs.
// CommonJS on purpose: Jest (no ESM transform for .mjs) can require() it directly.

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete'];

/** Normalise a path so `{id}` / `{group_id}` / `${groupId}` all compare equal. */
function normalizePath(path) {
  return path.replace(/\$?\{[^}]*\}/g, '{}');
}

function templateToPath(template) {
  return template
    .replace(/\$\{API_PREFIX\}/g, '/api/v1')
    .replace(/\$\{([^}]*)\}/g, (_m, name) => `{${name.trim()}}`);
}

/**
 * Parse the nested `endpoints` object literal into { 'auth.login': '/api/v1/auth/login/' }.
 * Supports plain template strings and `(arg) => \`...\`` builders, at any nesting depth.
 */
function parseEndpoints(source) {
  const start = source.search(/export\s+const\s+endpoints\s*=\s*\{/);
  if (start === -1)
    throw new Error('Could not find `export const endpoints = {` in endpoints source.');
  const body = source.slice(source.indexOf('{', start) + 1);
  const token = new RegExp(
    [
      '(\\w+):\\s*`([^`]*)`', // 1,2 leaf string
      '(\\w+):\\s*\\([^)]*\\)\\s*=>\\s*`([^`]*)`', // 3,4 leaf builder
      '(\\w+):\\s*\\{', // 5 open group
      '(\\})', // 6 close group
    ].join('|'),
    'g',
  );
  const stack = [];
  const result = {};
  let m;
  while ((m = token.exec(body)) !== null) {
    if (m[1] !== undefined) result[[...stack, m[1]].join('.')] = templateToPath(m[2]);
    else if (m[3] !== undefined) result[[...stack, m[3]].join('.')] = templateToPath(m[4]);
    else if (m[5] !== undefined) stack.push(m[5]);
    else if (m[6] !== undefined) {
      if (stack.length === 0) break; // closing brace of the endpoints object itself
      stack.pop();
    }
  }
  return result;
}

/**
 * Find `apiClient.<method>(... endpoints.a.b ...)` call sites.
 * Returns [{ method: 'GET', key: 'a.b', file, line }].
 */
function extractCalls(source, file) {
  const calls = [];
  const callRe = /\bapiClient\s*\.\s*(get|post|put|patch|delete)\b/g;
  let m;
  while ((m = callRe.exec(source)) !== null) {
    const rest = source.slice(m.index + m[0].length);
    const next = rest.search(/\bapiClient\s*\./);
    const window = rest.slice(0, next === -1 ? 800 : Math.min(next, 800));
    const ep = /\bendpoints\.([A-Za-z_][\w.]*?)(?=\s*[(),\s]|$)/.exec(window);
    if (!ep) continue;
    const line = source.slice(0, m.index).split('\n').length;
    calls.push({ method: m[1].toUpperCase(), key: ep[1], file, line });
  }
  return calls;
}

/** Literal `/api/v1/...` strings used as path prefixes outside endpoints.ts. */
function extractLiteralPrefixes(source, file) {
  const out = [];
  const re = /['"`](\/api\/v1\/[A-Za-z0-9_\-/{}]*)['"`]/g;
  let m;
  while ((m = re.exec(source)) !== null) {
    out.push({ path: m[1], file, line: source.slice(0, m.index).split('\n').length });
  }
  return out;
}

/** Index the OpenAPI document: normalised path -> { rawPath, methods:Set<UPPER> }. */
function indexContract(spec) {
  const index = new Map();
  for (const [rawPath, item] of Object.entries(spec.paths ?? {})) {
    const methods = new Set(
      Object.keys(item ?? {})
        .filter((k) => HTTP_METHODS.includes(k))
        .map((k) => k.toUpperCase()),
    );
    const norm = normalizePath(rawPath);
    const existing = index.get(norm);
    if (existing) methods.forEach((x) => existing.methods.add(x));
    else index.set(norm, { rawPath, methods });
  }
  return index;
}

function allowKey(kind, method, path) {
  return `${kind} ${method ?? '*'} ${normalizePath(path)}`;
}

/**
 * Compare app usage with the contract.
 * @param {object} p
 * @param {Record<string,string>} p.endpoints  parseEndpoints() result
 * @param {Array} p.calls                       extractCalls() results (all files)
 * @param {Array} p.prefixes                    extractLiteralPrefixes() results
 * @param {Map} p.contractIndex                 indexContract() result
 * @param {Array<{kind?:string,method?:string,path:string,reason:string}>} p.allowlist
 */
function compare({ endpoints, calls, prefixes = [], contractIndex, allowlist = [] }) {
  const allowed = new Map(allowlist.map((a) => [allowKey(a.kind ?? 'call', a.method, a.path), a]));
  const problems = [];
  const warnings = [];
  const usedAllow = new Set();
  const used = new Set();

  const isAllowed = (kind, method, path) => {
    for (const k of [allowKey(kind, method, path), allowKey(kind, undefined, path)]) {
      if (allowed.has(k)) {
        usedAllow.add(k);
        return true;
      }
    }
    return false;
  };

  for (const call of calls) {
    const path = endpoints[call.key];
    if (!path) {
      problems.push({
        type: 'unresolved',
        ...call,
        message: `endpoints.${call.key} is not defined`,
      });
      continue;
    }
    used.add(call.key);
    const entry = contractIndex.get(normalizePath(path));
    if (!entry) {
      if (!isAllowed('call', call.method, path))
        problems.push({
          type: 'unknown-path',
          ...call,
          path,
          message: `${call.method} ${path} not in contract`,
        });
    } else if (!entry.methods.has(call.method)) {
      if (!isAllowed('call', call.method, path))
        problems.push({
          type: 'method-mismatch',
          ...call,
          path,
          message: `${call.method} ${path}: contract allows ${[...entry.methods].join(', ')}`,
        });
    }
  }

  for (const [key, path] of Object.entries(endpoints)) {
    if (used.has(key)) continue;
    const entry = contractIndex.get(normalizePath(path));
    if (!entry && !isAllowed('endpoint', undefined, path))
      problems.push({
        type: 'unknown-path',
        key,
        path,
        message: `endpoints.${key} (${path}) not in contract and not called via apiClient`,
      });
    else if (entry)
      warnings.push(
        `endpoints.${key} is defined but never called through apiClient.<method>(endpoints.*)`,
      );
  }

  for (const lit of prefixes) {
    const norm = normalizePath(lit.path);
    const ok = [...contractIndex.keys()].some((p) => p === norm || p.startsWith(norm));
    if (!ok && !isAllowed('prefix', undefined, lit.path))
      problems.push({
        type: 'unknown-prefix',
        ...lit,
        message: `${lit.path} matches no contract path`,
      });
  }

  const stale = [...allowed.keys()].filter((k) => !usedAllow.has(k));
  return { problems, warnings, staleAllowlist: stale };
}

module.exports = {
  normalizePath,
  templateToPath,
  parseEndpoints,
  extractCalls,
  extractLiteralPrefixes,
  indexContract,
  compare,
};
