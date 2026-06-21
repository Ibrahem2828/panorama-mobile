import type { ConfigContext, ExpoConfig } from 'expo/config';
import { withAndroidManifest, type ConfigPlugin } from 'expo/config-plugins';

// Production/preview EAS profiles must inject HTTPS/WSS URLs via EAS secrets or env.
// Do not ship store releases with the temporary HTTP defaults below.
const DEFAULT_API_BASE_URL = 'http://eby52x8qksscjvfeqxf0eob7.76.13.155.172.sslip.io';
const DEFAULT_WS_BASE_URL = 'ws://eby52x8qksscjvfeqxf0eob7.76.13.155.172.sslip.io';

const withAndroidCleartextTraffic: ConfigPlugin<{ enabled: boolean }> = (config, { enabled }) =>
  withAndroidManifest(config, (androidConfig) => {
    const application = androidConfig.modResults.manifest.application?.[0];

    if (application) {
      application.$['android:usesCleartextTraffic'] = enabled ? 'true' : 'false';
    }

    return androidConfig;
  });

export default ({ config }: ConfigContext): ExpoConfig => {
  const appEnv = (process.env.EXPO_PUBLIC_APP_ENV ?? 'development').trim();
  const apiBaseUrl = (process.env.EXPO_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL).trim();
  const wsBaseUrl = (process.env.EXPO_PUBLIC_WS_BASE_URL ?? DEFAULT_WS_BASE_URL).trim();
  const selfServiceAuthEnabled =
    process.env.EXPO_PUBLIC_ENABLE_SELF_SERVICE_AUTH?.trim().toLowerCase() === 'true';
  const usesHttpApi = apiBaseUrl.toLowerCase().startsWith('http://');

  const expoConfig: ExpoConfig = {
    ...config,
    name: 'Panorama',
    slug: 'panorama-mobile',
    version: '0.1.0',
    orientation: 'portrait',
    scheme: 'panorama',
    icon: './src/assets/app/icon.png',
    userInterfaceStyle: 'light',
    // Native splash deferred: ExpoConfig (SDK 56) has no top-level splash field.
    // Asset ready at ./src/assets/app/splash.png — wire via expo-splash-screen plugin when upgrading.
    web: {
      ...config.web,
      favicon: './src/assets/app/favicon.png',
    },
    plugins: [
      'expo-secure-store',
      'expo-status-bar',
      [
        'expo-image-picker',
        {
          photosPermission:
            'Panorama needs access to your photo library so you can upload your student card for verification.',
          cameraPermission: false,
          microphonePermission: false,
        },
      ],
    ],
    ios: {
      ...config.ios,
      bundleIdentifier: 'com.panorama.student',
      supportsTablet: false,
    },
    android: {
      ...config.android,
      package: 'com.panorama.student',
      versionCode: 1,
      adaptiveIcon: {
        ...config.android?.adaptiveIcon,
        foregroundImage: './src/assets/app/adaptive-icon.png',
        backgroundColor: '#001B72',
      },
    },
    extra: {
      ...config.extra,
      appEnv,
      apiBaseUrl,
      wsBaseUrl,
      selfServiceAuthEnabled,
      eas: {
        projectId: '3804d959-0d36-4747-aeb0-d3339ad57f90',
      },
    },
  };

  // Temporary for the current HTTP VPS/Coolify backend. HTTPS makes this false.
  return withAndroidCleartextTraffic(expoConfig, { enabled: usesHttpApi });
};
