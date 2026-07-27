# Package lock regeneration required

The original archive contained a `package-lock.json` for version 0.1.0 and an older dependency graph.
It was deliberately removed because using a stale lock would produce a false and unsafe build.

Before committing or releasing this v2 candidate, run in a network-enabled environment:

```bash
npm install
npx expo install --fix
npm run validate:release
```

Review the generated lockfile, commit it, and require `npm ci` in CI and EAS builds.
