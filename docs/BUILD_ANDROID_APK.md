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
