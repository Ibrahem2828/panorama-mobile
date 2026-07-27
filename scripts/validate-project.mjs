#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const srcRoot = path.join(root, 'src');
const codeExtensions = ['.ts', '.tsx', '.js', '.jsx', '.json'];
const assetExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif'];
const allExtensions = [...codeExtensions, ...assetExtensions];
const errors = [];
const warnings = [];

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(target);
    return [target];
  });
}

function resolveLocalImport(fromFile, specifier) {
  let base;
  if (specifier.startsWith('@/')) base = path.join(srcRoot, specifier.slice(2));
  else if (specifier.startsWith('.')) base = path.resolve(path.dirname(fromFile), specifier);
  else return true;

  const candidates = [base];
  for (const ext of allExtensions) candidates.push(`${base}${ext}`);
  for (const ext of codeExtensions) candidates.push(path.join(base, `index${ext}`));
  return candidates.some((candidate) => fs.existsSync(candidate));
}

const codeFiles = walk(srcRoot).filter((file) => /\.(ts|tsx|js|jsx)$/.test(file));
const importRegex =
  /(?:import\s+(?:[^'";]+?\s+from\s+)?|export\s+[^'";]+?\s+from\s+|require\s*\(|import\s*\()\s*['"]([^'"]+)['"]/g;
for (const file of codeFiles) {
  const text = fs.readFileSync(file, 'utf8');
  for (const match of text.matchAll(importRegex)) {
    const specifier = match[1];
    if (!resolveLocalImport(file, specifier)) {
      errors.push(`Missing local import in ${path.relative(root, file)}: ${specifier}`);
    }
  }
}

const requiredAssets = [
  'src/assets/app/icon.png',
  'src/assets/app/adaptive-icon.png',
  'src/assets/app/favicon.png',
  'src/assets/app/splash.png',
];
for (const relativePath of requiredAssets) {
  if (!fs.existsSync(path.join(root, relativePath)))
    errors.push(`Missing required asset: ${relativePath}`);
}

const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const requiredPackages = [
  'expo-secure-store',
  'expo-notifications',
  'expo-screen-capture',
  'react-native-webview',
  '@react-native-community/netinfo',
];
for (const name of requiredPackages) {
  if (!packageJson.dependencies?.[name]) errors.push(`Missing required dependency: ${name}`);
}

const sourceText = codeFiles.map((file) => fs.readFileSync(file, 'utf8')).join('\n');
const forbiddenPatterns = [
  ['obsolete student-account-requests endpoint', /student-account-requests/],
  ['raw WhatsApp URL model field', /whatsapp_(?:url|link)/],
  ['legacy direct file URL field', /\bdownload_url\b/],
];
for (const [label, pattern] of forbiddenPatterns) {
  if (pattern.test(sourceText)) warnings.push(`Review ${label}: pattern still exists.`);
}

const appConfig = fs.readFileSync(path.join(root, 'app.config.ts'), 'utf8');
if (!appConfig.includes('Release builds require an HTTPS API URL')) {
  errors.push('app.config.ts does not enforce HTTPS for release builds.');
}
if (!appConfig.includes('Release builds require a WSS WebSocket URL')) {
  errors.push('app.config.ts does not enforce WSS for release builds.');
}
if (
  /usesCleartextTraffic[^\n]+true/.test(appConfig) &&
  !appConfig.includes('allowDevelopmentCleartext')
) {
  errors.push('Android cleartext traffic appears to be enabled unconditionally.');
}

const envExample = fs.readFileSync(path.join(root, '.env.example'), 'utf8');
for (const envName of ['EXPO_PUBLIC_API_BASE_URL', 'EXPO_PUBLIC_WS_BASE_URL']) {
  if (!envExample.includes(envName)) errors.push(`.env.example is missing ${envName}.`);
}

const lockPath = path.join(root, 'package-lock.json');
if (fs.existsSync(lockPath)) {
  try {
    const lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
    const lockRoot = lock.packages?.[''];
    if (lockRoot?.version !== packageJson.version) {
      warnings.push(
        `package-lock root version (${lockRoot?.version ?? 'unknown'}) differs from package.json (${packageJson.version}).`,
      );
    }
    for (const [name, version] of Object.entries(packageJson.dependencies ?? {})) {
      if (lockRoot?.dependencies?.[name] !== version) {
        warnings.push(`package-lock dependency mismatch for ${name}.`);
      }
    }
  } catch (error) {
    errors.push(`package-lock.json is invalid JSON: ${error.message}`);
  }
} else {
  warnings.push('package-lock.json is absent; regenerate it before CI/release.');
}

console.log(`Validated ${codeFiles.length} source files.`);
if (warnings.length) {
  console.log(`\nWarnings (${warnings.length}):`);
  for (const warning of warnings) console.log(`- ${warning}`);
}
if (errors.length) {
  console.error(`\nErrors (${errors.length}):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log('\nStatic project validation passed.');
