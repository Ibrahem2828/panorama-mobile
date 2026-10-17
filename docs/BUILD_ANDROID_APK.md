# Building the Android APK locally (production)

Requirements: JDK 17, Android SDK (platform 35/36, build-tools, NDK 27.1.12297006, CMake 3.22.1), Node 20+.
Export `ANDROID_HOME`, `JAVA_HOME` and make sure `android/local.properties` has `sdk.dir`.

## 1. Environment (production values)

```bash
export EXPO_PUBLIC_APP_ENV=production
export EXPO_PUBLIC_API_BASE_URL=https://api.xn--mgbaab0cxheq.tech
export EXPO_PUBLIC_WS_BASE_URL=wss://api.xn--mgbaab0cxheq.tech
export EXPO_PUBLIC_SUPPORT_EMAIL=panoramacompany31@gmail.com
```

`app.config.ts` refuses a non-https API/WebSocket URL for any build that is not `development`.

## 2. Release signing (never commit the keystore)

`app.config.ts` reads the signing key from the environment. Without these variables the build falls back to the
debug key (fine for tests, not for distribution):

```bash
export PANORAMA_KEYSTORE_FILE=/absolute/path/panorama-release.jks
export PANORAMA_KEYSTORE_PASSWORD=...
export PANORAMA_KEY_ALIAS=panorama
export PANORAMA_KEY_PASSWORD=...
```

Keep a backup of the keystore: an installed app can only be updated by an APK signed with the same key.

## 3. Build

```bash
npx expo prebuild --platform android --no-install   # regenerates android/ (git-ignored)
cd android
./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a                     # modern phones (smallest)
./gradlew assembleRelease -PreactNativeArchitectures=armeabi-v7a,arm64-v8a,x86_64  # universal
```

Output: `android/app/build/outputs/apk/release/app-release.apk`. Release builds use R8 and resource shrinking.

## 4. Testing against a local backend (emulator)

Build with `EXPO_PUBLIC_APP_ENV=development EXPO_PUBLIC_ALLOW_CLEARTEXT=true`,
`EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:8000` and `EXPO_PUBLIC_WS_BASE_URL=ws://10.0.2.2:8000`, then re-run
`expo prebuild` (the cleartext flag is written into the manifest). Add `10.0.2.2` to the backend `ALLOWED_HOSTS`.
Never ship that variant.

## Notes

- Faculty themes: the colour scheme follows the student's faculty (medicine green, dentistry blue, pharmacy lavender,
  informatics orange, petroleum navy, business rose); logos live in `src/assets/faculty`.
- Arabic is the default language and the layout is right-to-left from the first launch (a config plugin seeds the
  native RTL preference).
- The legal pages open from `https://app.xn--mgbaab0cxheq.tech/legal/{terms,privacy}.html`.

## Certificate pinning

Production builds pin the API host (`api.xn--mgbaab0cxheq.tech` and subdomains) in the generated
`network_security_config.xml` (see `API_PINS` in `app.config.ts`).

- **What is pinned:** the SPKI hashes of long-lived CA *roots* (Let's Encrypt ISRG X1/X2, ZeroSSL's USERTrust RSA/ECC and
  Google Trust Services R1/R3/R4), never the leaf or an intermediate. Let's Encrypt renews the leaf every ~60 days and
  rotates intermediates every few years, so pinning those would lock users out after a routine renewal. Android checks
  the pins against the whole validated chain, so any chain ending in one of these roots passes (including cross-signed
  ones). A certificate from another CA, or from a user-installed/malicious CA, is rejected.
- **Safety net:** `PIN_EXPIRATION` (currently 2027-12-31). After that date Android stops enforcing the pins, so a stale
  list can never brick the app permanently. Bump it (and re-check the list) at every release.
- **When it needs attention:** only if the server's CA changes to one that is not in the list (for example a different
  ACME provider). Add that CA's root SPKI hash, ship a new build, and only then switch the server's CA. Keep users on
  an app version that already trusts the new root before the switch.
- **Compute a root's pin:**
  `openssl x509 -in root.pem -noout -pubkey | openssl pkey -pubin -outform der | openssl dgst -sha256 -binary | openssl base64`
- **Verified:** a build with these pins reaches the API (login answers "invalid credentials"); a build whose pin set was
  replaced by a bogus hash fails to connect.
