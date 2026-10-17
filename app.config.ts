/// <reference types="node" />
import type { ConfigContext, ExpoConfig } from 'expo/config';
import fs from 'node:fs';
import path from 'node:path';

import {
  withAndroidManifest,
  withAppBuildGradle,
  withDangerousMod,
  withGradleProperties,
  withMainApplication,
  type ConfigPlugin,
} from 'expo/config-plugins';

const DEVELOPMENT_API_BASE_URL = 'http://127.0.0.1:8000';
const DEVELOPMENT_WS_BASE_URL = 'ws://127.0.0.1:8000';

const withAndroidCleartextTraffic: ConfigPlugin<{ enabled: boolean }> = (config, { enabled }) =>
  withAndroidManifest(config, (androidConfig) => {
    const application = androidConfig.modResults.manifest.application?.[0];
    if (application) application.$['android:usesCleartextTraffic'] = enabled ? 'true' : 'false';
    return androidConfig;
  });

// Android 11+ package visibility: lets the app resolve `whatsapp://` links so the group's WhatsApp button
// opens the installed app directly (the link itself is issued by the server and never shown).
const withWhatsAppPackageVisibility: ConfigPlugin = (config) =>
  withAndroidManifest(config, (androidConfig) => {
    const manifest = androidConfig.modResults.manifest;
    const queries = (manifest.queries ??= []);
    const alreadyDeclared = queries.some((query) =>
      query.intent?.some((intent) =>
        intent.data?.some((data) => data.$['android:scheme'] === 'whatsapp'),
      ),
    );
    if (!alreadyDeclared) {
      queries.push({
        intent: [
          {
            action: [{ $: { 'android:name': 'android.intent.action.VIEW' } }],
            data: [{ $: { 'android:scheme': 'whatsapp' } }],
          },
        ],
      });
    }
    return androidConfig;
  });

// Arabic is the default language, so the app must lay out right-to-left from the very first launch.
// React Native only applies forceRTL on the next start, so seed the preference natively; once the
// user picks a language in Settings the JS side overwrites it.
const withDefaultRtl: ConfigPlugin = (config) =>
  withMainApplication(config, (mod) => {
    const marker = '// panorama-default-rtl';
    if (mod.modResults.language === 'kt' && !mod.modResults.contents.includes(marker)) {
      mod.modResults.contents = mod.modResults.contents.replace(
        'super.onCreate()',
        `super.onCreate()
    ${marker}
    val rtlPrefs = getSharedPreferences("com.facebook.react.modules.i18nmanager.I18nUtil", MODE_PRIVATE)
    if (!rtlPrefs.contains("RCTI18nUtil_forceRTL")) {
      com.facebook.react.modules.i18nmanager.I18nUtil.instance.allowRTL(this, true)
      com.facebook.react.modules.i18nmanager.I18nUtil.instance.forceRTL(this, true)
    }`,
      );
    }
    return mod;
  });

// Release signing comes from the environment (never from the repo): set PANORAMA_KEYSTORE_FILE,
// PANORAMA_KEYSTORE_PASSWORD, PANORAMA_KEY_ALIAS and PANORAMA_KEY_PASSWORD when building a store/APK
// release. Without them the build falls back to the debug key so local test builds keep working.
const withReleaseSigning: ConfigPlugin = (config) => {
  const withGradle = withAppBuildGradle(config, (mod) => {
    const marker = '// panorama-release-signing';
    if (mod.modResults.language === 'groovy' && !mod.modResults.contents.includes(marker)) {
      let contents = mod.modResults.contents;
      // 1) point buildTypes.release at the release key (before the signingConfigs block exists, so the
      //    pattern cannot match anything else); 2) add the environment-driven release signing config.
      contents = contents.replace(
        /(buildTypes\s*\{[\s\S]*?release\s*\{[\s\S]*?)signingConfig signingConfigs\.debug/,
        '$1signingConfig System.getenv("PANORAMA_KEYSTORE_FILE") ? signingConfigs.release : signingConfigs.debug',
      );
      contents = contents.replace(
        'signingConfigs {',
        `signingConfigs {
        ${marker}
        release {
            def keystoreFile = System.getenv("PANORAMA_KEYSTORE_FILE")
            if (keystoreFile) {
                storeFile file(keystoreFile)
                storePassword System.getenv("PANORAMA_KEYSTORE_PASSWORD")
                keyAlias System.getenv("PANORAMA_KEY_ALIAS")
                keyPassword System.getenv("PANORAMA_KEY_PASSWORD")
            }
        }`,
      );
      mod.modResults.contents = contents;
    }
    return mod;
  });

  // Smaller, faster release builds: R8 shrinking + resource shrinking.
  return withGradleProperties(withGradle, (mod) => {
    const set = (key: string, value: string) => {
      const existing = mod.modResults.find((item) => item.type === 'property' && item.key === key);
      if (existing && existing.type === 'property') {
        existing.value = value;
      } else {
        mod.modResults.push({ type: 'property', key, value });
      }
    };
    set('android.enableMinifyInReleaseBuilds', 'true');
    set('android.enableShrinkResourcesInReleaseBuilds', 'true');
    return mod;
  });
};

// App hardening for the installed APK:
//  - no cloud/adb backups or device-to-device extraction of app data (tokens, cached profile),
//  - HTTPS only with the system trust store (user-installed CAs are never trusted),
//  - no debuggable flag outside development builds.
// Certificate pinning for the API host. The pins are SPKI hashes of long-lived CA ROOTS, never of the leaf or of an
// intermediate: Let's Encrypt rotates leaf certificates every ~60 days and intermediates every few years, so pinning
// those would lock users out of the app after a routine renewal. Android checks the pins against every certificate in
// the validated chain, so any chain that ends in one of these roots passes (including LE's cross-signed chains).
// The roots cover the CAs an ACME proxy (Traefik/Caddy/Coolify) can use: Let's Encrypt, ZeroSSL and Google Trust
// Services. A certificate from any other CA, or from a user-installed or malicious CA, is rejected.
// Safety net: pinning stops being enforced after PIN_EXPIRATION, so a forgotten pin set can never brick the app for
// good. Review this list and the date at every release (docs/BUILD_ANDROID_APK.md, "Certificate pinning").
const PIN_EXPIRATION = '2027-12-31';
const API_PINS: ReadonlyArray<readonly [string, string]> = [
  ['C5+lpZ7tcVwmwQIMcRtPbsQtWLABXhQzejna0wHFr8M=', "ISRG Root X1 (Let's Encrypt)"],
  ['diGVwiVYbubAI3RW4hB9xU8e/CH2GnkuvVFZE8zmgzI=', "ISRG Root X2 (Let's Encrypt)"],
  ['x4QzPSC810K5/cMjb05Qm4k3Bw5zBn4lTdO/nEW/Td4=', 'USERTrust RSA (ZeroSSL)'],
  ['ICGRfpgmOUXIWcQ/HXPLQTkFPEFPoDyjvH7ohhQpjzs=', 'USERTrust ECC (ZeroSSL)'],
  ['hxqRlPTu1bMS/0DITB1SSu0vd4u/8l8TjPgfaAp63Gc=', 'GTS Root R1 (Google Trust Services)'],
  ['QXnt2YHvdHR3tJYmQIr0Paosp6t/nggsEGD4QJZ3Q0g=', 'GTS Root R3 (Google Trust Services)'],
  ['mEflZT5enoR1FuXLgYYGqnVEoZvmf9c2bVBpiOjYQ0c=', 'GTS Root R4 (Google Trust Services)'],
];

const SECURITY_XML = {
  networkSecurityConfig: `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
  <base-config cleartextTrafficPermitted="false">
    <trust-anchors>
      <certificates src="system" />
    </trust-anchors>
  </base-config>
  <domain-config cleartextTrafficPermitted="false">
    <domain includeSubdomains="true">xn--mgbaab0cxheq.tech</domain>
    <trust-anchors>
      <certificates src="system" />
    </trust-anchors>
    <pin-set expiration="${PIN_EXPIRATION}">
${API_PINS.map(([digest, label]) => `      <pin digest="SHA-256">${digest}</pin> <!-- ${label} -->`).join('\n')}
    </pin-set>
  </domain-config>
</network-security-config>
`,
  dataExtractionRules: `<?xml version="1.0" encoding="utf-8"?>
<data-extraction-rules>
  <cloud-backup>
    <exclude domain="root" />
    <exclude domain="file" />
    <exclude domain="database" />
    <exclude domain="sharedpref" />
    <exclude domain="external" />
  </cloud-backup>
  <device-transfer>
    <exclude domain="root" />
    <exclude domain="file" />
    <exclude domain="database" />
    <exclude domain="sharedpref" />
    <exclude domain="external" />
  </device-transfer>
</data-extraction-rules>
`,
};

const withAppHardening: ConfigPlugin<{ production: boolean }> = (config, { production }) => {
  const withManifest = withAndroidManifest(config, (mod) => {
    const application = mod.modResults.manifest.application?.[0];
    if (application) {
      application.$['android:allowBackup'] = 'false';
      application.$['android:fullBackupContent'] = 'false';
      application.$['android:dataExtractionRules'] = '@xml/data_extraction_rules';
      if (production) {
        application.$['android:networkSecurityConfig'] = '@xml/network_security_config';
      }
    }
    return mod;
  });

  return withDangerousMod(withManifest, [
    'android',
    async (mod) => {
      const xmlDir = path.join(mod.modRequest.platformProjectRoot, 'app/src/main/res/xml');
      fs.mkdirSync(xmlDir, { recursive: true });
      fs.writeFileSync(
        path.join(xmlDir, 'data_extraction_rules.xml'),
        SECURITY_XML.dataExtractionRules,
      );
      if (production) {
        fs.writeFileSync(
          path.join(xmlDir, 'network_security_config.xml'),
          SECURITY_XML.networkSecurityConfig,
        );
      }
      return mod;
    },
  ]);
};

function requiredReleaseValue(name: string, value: string | undefined, appEnv: string): string {
  const normalized = value?.trim();
  if (appEnv !== 'development' && !normalized) {
    throw new Error(`${name} is required for ${appEnv} builds.`);
  }
  return normalized ?? '';
}

const EAS_PROJECT_ID = '3804d959-0d36-4747-aeb0-d3339ad57f90';
const DEFAULT_PRIVACY_URL = 'https://app.xn--mgbaab0cxheq.tech/legal/privacy.html';
const DEFAULT_LEGAL_URL = 'https://app.xn--mgbaab0cxheq.tech/legal/';
const DEFAULT_TERMS_URL = 'https://app.xn--mgbaab0cxheq.tech/legal/terms.html';

export default ({ config }: ConfigContext): ExpoConfig => {
  const appEnv = (process.env.EXPO_PUBLIC_APP_ENV ?? 'development').trim();
  const configuredApi = requiredReleaseValue(
    'EXPO_PUBLIC_API_BASE_URL',
    process.env.EXPO_PUBLIC_API_BASE_URL,
    appEnv,
  );
  const configuredWs = requiredReleaseValue(
    'EXPO_PUBLIC_WS_BASE_URL',
    process.env.EXPO_PUBLIC_WS_BASE_URL,
    appEnv,
  );
  const apiBaseUrl = configuredApi || DEVELOPMENT_API_BASE_URL;
  const wsBaseUrl = configuredWs || DEVELOPMENT_WS_BASE_URL;
  const allowDevelopmentCleartext =
    appEnv === 'development' &&
    process.env.EXPO_PUBLIC_ALLOW_CLEARTEXT?.trim().toLowerCase() === 'true';

  if (appEnv !== 'development' && !apiBaseUrl.startsWith('https://')) {
    throw new Error('Release builds require an HTTPS API URL.');
  }
  if (appEnv !== 'development' && !wsBaseUrl.startsWith('wss://')) {
    throw new Error('Release builds require a WSS WebSocket URL.');
  }

  const expoConfig: ExpoConfig = {
    ...config,
    name: 'Panorama',
    slug: 'panorama-mobile',
    version: '2.5.0',
    orientation: 'portrait',
    scheme: 'panorama',
    icon: './src/assets/app/icon.png',
    userInterfaceStyle: 'automatic',
    runtimeVersion: { policy: 'appVersion' },
    updates: {
      url: `https://u.expo.dev/${EAS_PROJECT_ID}`,
      // No over-the-air code updates: the app only runs the code inside the signed APK.
      enabled: false,
      checkAutomatically: 'NEVER',
      fallbackToCacheTimeout: 0,
    },
    plugins: [
      'expo-secure-store',
      [
        'expo-font',
        {
          fonts: [
            './src/assets/fonts/NotoKufiArabic-Regular.ttf',
            './src/assets/fonts/NotoKufiArabic-SemiBold.ttf',
            './src/assets/fonts/NotoKufiArabic-Bold.ttf',
          ],
        },
      ],
      'expo-notifications',
      'expo-updates',
      [
        'expo-splash-screen',
        {
          image: './src/assets/app/splash.png',
          imageWidth: 288,
          resizeMode: 'contain',
          backgroundColor: '#FFFFFF',
          dark: { backgroundColor: '#0B1020', image: './src/assets/app/splash-dark.png' },
        },
      ],
      [
        'expo-image-picker',
        {
          photosPermission:
            'يحتاج بانوراما للوصول إلى الصور لرفع البطاقة الجامعية أو المرفقات التي تختارها.',
          cameraPermission: false,
          microphonePermission: false,
        },
      ],
    ],
    ios: {
      ...config.ios,
      bundleIdentifier: 'com.panorama.student',
      buildNumber: '1',
      supportsTablet: true,
      config: { usesNonExemptEncryption: false },
      infoPlist: {
        ...config.ios?.infoPlist,
        ITSAppUsesNonExemptEncryption: false,
        NSAppTransportSecurity: { NSAllowsArbitraryLoads: false },
      },
    },
    android: {
      ...config.android,
      package: 'com.panorama.student',
      versionCode: 250,
      adaptiveIcon: {
        foregroundImage: './src/assets/app/adaptive-icon.png',
        monochromeImage: './src/assets/app/adaptive-icon-monochrome.png',
        backgroundColor: '#FFFFFF',
      },
      permissions: ['POST_NOTIFICATIONS'],
      blockedPermissions: [
        'android.permission.READ_EXTERNAL_STORAGE',
        'android.permission.WRITE_EXTERNAL_STORAGE',
        'android.permission.SYSTEM_ALERT_WINDOW',
        'android.permission.RECORD_AUDIO',
        'android.permission.READ_PHONE_STATE',
      ],
    },
    web: { ...config.web, favicon: './src/assets/app/favicon.png' },
    extra: {
      ...config.extra,
      appEnv,
      apiBaseUrl,
      wsBaseUrl,
      supportEmail: process.env.EXPO_PUBLIC_SUPPORT_EMAIL ?? 'panoramacompany31@gmail.com',
      sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN ?? '',
      dashboardUrl: process.env.EXPO_PUBLIC_DASHBOARD_URL ?? '',
      privacyUrl: process.env.EXPO_PUBLIC_PRIVACY_URL ?? DEFAULT_PRIVACY_URL,
      termsUrl: process.env.EXPO_PUBLIC_TERMS_URL ?? DEFAULT_TERMS_URL,
      legalUrl: process.env.EXPO_PUBLIC_LEGAL_URL ?? DEFAULT_LEGAL_URL,
      eas: { projectId: EAS_PROJECT_ID },
    },
  };

  return withReleaseSigning(
    withAppHardening(
      withDefaultRtl(
        withWhatsAppPackageVisibility(
          withAndroidCleartextTraffic(expoConfig, { enabled: allowDevelopmentCleartext }),
        ),
      ),
      { production: appEnv === 'production' },
    ),
  );
};
