// Pins the backend OpenAPI contract in contracts/openapi.json and verifies the app against it.
//   node scripts/contract-check.mjs --sync   copy from BACKEND_OPENAPI_SOURCE (default
//                                            ../backend/docs/api/openapi.json), normalise to LF,
//                                            and re-record contracts/contract-target.json
//   node scripts/contract-check.mjs          verify pin integrity + every endpoint the app calls
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const {
  parseEndpoints,
  extractCalls,
  extractLiteralPrefixes,
  indexContract,
  compare,
} = require('./lib/contract-extract.cjs');

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const contractPath = path.join(root, 'contracts', 'openapi.json');
const targetPath = path.join(root, 'contracts', 'contract-target.json');
const allowlistPath = path.join(root, 'contracts', 'contract-allowlist.json');
const endpointsPath = path.join(root, 'src', 'api', 'endpoints.ts');
const METHODS = new Set(['get', 'post', 'put', 'patch', 'delete']);

const toLf = (text) => text.replace(/\r\n?/g, '\n');
const sha256 = (text) => createHash('sha256').update(text).digest('hex');

function describe(text) {
  const spec = JSON.parse(text);
  const paths = spec.paths ?? {};
  return {
    spec,
    sha256: sha256(text),
    pathCount: Object.keys(paths).length,
    operationCount: Object.values(paths).reduce(
      (n, item) => n + Object.keys(item ?? {}).filter((k) => METHODS.has(k)).length,
      0,
    ),
    schemaCount: Object.keys(spec.components?.schemas ?? {}).length,
  };
}

function fail(message) {
  console.error(`contracts:check FAILED: ${message}`);
  process.exit(1);
}

if (process.argv.includes('--sync')) {
  const source = path.resolve(
    process.env.BACKEND_OPENAPI_SOURCE ??
      path.join(root, '..', 'backend', 'docs', 'api', 'openapi.json'),
  );
  if (!existsSync(source)) fail(`OpenAPI source not found: ${source}`);
  const text = toLf(readFileSync(source, 'utf8'));
  const info = describe(text); // throws on invalid JSON
  writeFileSync(contractPath, text);
  const { sha256: hash, pathCount, operationCount, schemaCount } = info;
  writeFileSync(
    targetPath,
    `${JSON.stringify({ sha256: hash, pathCount, operationCount, schemaCount }, null, 2)}\n`,
  );
  console.log(`Synced contract ${hash} (${pathCount} paths, ${operationCount} operations).`);
  process.exit(0);
}

// ---- Integrity of the pin ----
if (!existsSync(contractPath))
  fail('contracts/openapi.json is missing. Run `npm run contracts:sync`.');
if (!existsSync(targetPath))
  fail('contracts/contract-target.json is missing. Run `npm run contracts:sync`.');
const raw = readFileSync(contractPath, 'utf8');
if (raw.includes('\r'))
  fail('contracts/openapi.json contains CR characters; it must use LF line endings.');
let info;
try {
  info = describe(raw);
} catch (error) {
  fail(`contracts/openapi.json does not parse: ${error.message}`);
}
const target = JSON.parse(readFileSync(targetPath, 'utf8'));
for (const key of ['sha256', 'pathCount', 'operationCount', 'schemaCount']) {
  if (info[key] !== target[key]) {
    fail(
      `${key} differs from contract-target.json (recorded ${target[key]}, actual ${info[key]}). Run \`npm run contracts:sync\` if the change is intended.`,
    );
  }
}

// ---- App usage vs contract ----
function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return name === '__tests__' ? [] : walk(full);
    return /\.(ts|tsx)$/.test(name) ? [full] : [];
  });
}

const endpoints = parseEndpoints(readFileSync(endpointsPath, 'utf8'));
const calls = [];
const prefixes = [];
for (const file of walk(path.join(root, 'src'))) {
  const rel = path.relative(root, file).split(path.sep).join('/');
  const text = readFileSync(file, 'utf8');
  calls.push(...extractCalls(text, rel));
  if (file !== endpointsPath) prefixes.push(...extractLiteralPrefixes(text, rel));
}
const allowlist = existsSync(allowlistPath) ? JSON.parse(readFileSync(allowlistPath, 'utf8')) : [];
for (const entry of allowlist) {
  if (!entry.path || !entry.reason)
    fail('Every contract-allowlist.json entry needs `path` and `reason`.');
}

const { problems, warnings, staleAllowlist } = compare({
  endpoints,
  calls,
  prefixes,
  contractIndex: indexContract(info.spec),
  allowlist,
});

for (const w of warnings) console.warn(`warning: ${w}`);
for (const k of staleAllowlist) console.error(`stale allowlist entry (no longer needed): ${k}`);
for (const p of problems) {
  const where = p.file ? ` (${p.file}:${p.line})` : '';
  console.error(`${p.type}: ${p.message}${where}`);
}
if (problems.length > 0 || staleAllowlist.length > 0) {
  fail(
    `${problems.length} contract mismatch(es), ${staleAllowlist.length} stale allowlist entr(ies).`,
  );
}
console.log(
  `Contract OK: sha256 ${info.sha256.slice(0, 12)}, ${Object.keys(endpoints).length} endpoints, ${calls.length} call sites verified.`,
);
