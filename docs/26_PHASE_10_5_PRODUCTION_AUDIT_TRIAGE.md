# Phase 10.5: Production Audit Triage & Expo Transitive Vulnerability Decision

## Purpose

Phase 10.5 investigates the reported production audit concern before moving to Printing
Foundation. It does not implement product features, does not change app UI, and does not change
Expo SDK.

## Audit Issue Summary

The reported concern was a previous `npm audit --omit=dev` finding for `uuid <11.1.1` through
Expo transitive tooling packages:

- `uuid`
- `xcode`
- `@expo/config-plugins`
- `@expo/config`
- `@expo/cli`
- `@expo/metro-config`
- `@expo/prebuild-config`

The current local audit result is clean:

- `npm audit`: `found 0 vulnerabilities`
- `npm audit --omit=dev`: `found 0 vulnerabilities`

No package override or dependency downgrade was needed.

## Dependency Path

Current dependency tree:

```txt
expo@56.0.8
└─ @expo/config-plugins@56.0.8
   └─ xcode@3.0.1
      └─ uuid@7.0.3
```

`@expo/cli`, `@expo/config`, `@expo/prebuild-config`, and `@expo/metro-config` also reference
the same Expo SDK 56 tooling graph and dedupe to `@expo/config-plugins@56.0.8`.

Lockfile evidence:

- `node_modules/xcode` depends on `uuid: ^7.0.3`.
- `node_modules/uuid` is installed at `7.0.3`.
- `node_modules/@expo/config-plugins` is installed at `56.0.8`.

## Root Cause

`uuid` is not a direct dependency of Panorama Mobile. It is pulled transitively by `xcode`, which
is pulled by Expo config plugins. The package is used by `xcode/lib/pbxProject.js` to generate
Xcode project identifiers during native project/config tooling workflows.

## Runtime Reachability

The vulnerable path is not imported by the application source code:

- No `uuid`, `xcode`, `@expo/config-plugins`, `@expo/config`, or `@expo/cli` imports exist in
  `src/`.
- The path belongs to Expo tooling/build/config packages, not React Native app runtime code.
- The mobile app bundle does not directly execute `xcode` for normal runtime screens.

## Mitigation Attempts

`npm audit fix --dry-run` was run because current audit is already clean. It reported:

```txt
up to date, audited 590 packages
found 0 vulnerabilities
```

No actual `npm audit fix` mutation was required.

No `overrides` entry was added. Forcing `uuid` to `11.x` under `xcode@3.0.1` is unnecessary while
audit is clean, and compatibility should not be assumed without an upstream Expo/xcode release
that declares support.

## Why `npm audit fix --force` Was Not Used

`npm audit fix --force` was intentionally avoided. Previous audit guidance suggested an Expo
downgrade path, which would break the production SDK 56 baseline. Forced audit fixes are not
acceptable for this project because they can downgrade Expo or install incompatible transitive
tooling.

## Expo SDK Decision

Expo SDK 56 was preserved:

- `expo`: `56.0.8`
- public config `sdkVersion`: `56.0.0`
- `npx expo-doctor`: 21/21 checks passed
- `npx expo install --check`: dependencies are up to date

## Commands Run

- `npm run validate`: passed
- `npm audit`: passed, 0 vulnerabilities
- `npm audit --omit=dev`: passed, 0 vulnerabilities
- `npm ls uuid`: passed and showed `uuid@7.0.3` under `xcode@3.0.1`
- `npm ls xcode`: passed and showed `xcode@3.0.1` under `@expo/config-plugins@56.0.8`
- `npm ls @expo/config-plugins`: passed
- `npm ls expo @expo/cli @expo/config @expo/config-plugins @expo/prebuild-config @expo/metro-config`: passed
- `npx expo config --type public`: passed and showed `sdkVersion: 56.0.0`
- `npx expo-doctor`: passed, 21/21
- `npx expo install --check`: passed, dependencies are up to date
- `npm audit fix --dry-run`: passed, no changes needed

## Validation Results

- `npm run typecheck`: passed through `npm run validate`
- `npm run lint`: passed through `npm run validate`
- `npm run format:check`: passed through `npm run validate`
- `npm run expo:config`: passed through `npm run validate`
- `npm run validate`: passed
- `npx expo config --type public`: passed
- `npx expo-doctor`: passed, 21/21
- `npx expo install --check`: passed
- `npm audit`: passed, 0 vulnerabilities
- `npm audit --omit=dev`: passed, 0 vulnerabilities

No Expo dev server, emulator, Metro server, EAS build, Android build, iOS build, or web server
was started.

## Final Decision

Outcome A: fully fixed / currently clean.

The previously reported audit issue is not reproducible in the current dependency audit. The
dependency path still exists as Expo tooling, but it is not currently reported as vulnerable by
`npm audit`, and it is not believed to affect mobile app runtime.

## Next Review Trigger

Revisit this decision when any of the following occurs:

- `npm audit` or `npm audit --omit=dev` reports `uuid`, `xcode`, or Expo tooling again.
- Expo SDK 56 publishes a patch update that changes `@expo/config-plugins`, `xcode`, or related
  tooling.
- The project starts native prebuild workflows more aggressively.
- Before the next production release candidate audit.

## Phase 11 Readiness

The project can proceed to Phase 11 Printing Foundation. Expo SDK 56 is preserved, audit is clean,
and no forced fix or override was applied.
