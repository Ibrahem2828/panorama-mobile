import type { ConfigContext, ExpoConfig } from 'expo/config';
import { withAndroidManifest, type ConfigPlugin } from 'expo/config-plugins';

const DEVELOPMENT_API_BASE_URL = 'http://127.0.0.1:8000';
const DEVELOPMENT_WS_BASE_URL = 'ws://127.0.0.1:8000';

const withAndroidCleartextTraffic: ConfigPlugin<{ enabled: boolean }> = (config, { enabled }) =>
  withAndroidManifest(config, (androidConfig) => {
    const application = androidConfig.modResults.manifest.application?.[0];
    if (application) application.$['android:usesCleartextTraffic'] = enabled ? 'true' : 'false';
    return androidConfig;
  });

function requiredReleaseValue(name: string, value: string | undefined, appEnv: string): string {
  const normalized = value?.trim();
  if (appEnv !== 'development' && !normalized) {
    throw new Error(`${name} is required for ${appEnv} builds.`);
  }
  return normalized ?? '';
}

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
    version: '2.0.0',
    orientation: 'portrait',
    scheme: 'panorama',
    icon: './src/assets/app/icon.png',
    userInterfaceStyle: 'automatic',
    plugins: [
      'expo-secure-store',
      'expo-notifications',
      [
        'expo-splash-screen',
        {
          image: './src/assets/app/splash.png',
          imageWidth: 220,
          resizeMode: 'contain',
          backgroundColor: '#FFFFFF',
          dark: { backgroundColor: '#080D22' },
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
      supportsTablet: true,
      infoPlist: {
        ...config.ios?.infoPlist,
        NSAppTransportSecurity: { NSAllowsArbitraryLoads: false },
      },
    },
    android: {
      ...config.android,
      package: 'com.panorama.student',
      versionCode: 200,
      adaptiveIcon: {
        foregroundImage: './src/assets/app/adaptive-icon.png',
        backgroundColor: '#FFFFFF',
      },
      permissions: ['POST_NOTIFICATIONS'],
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
      eas: { projectId: '3804d959-0d36-4747-aeb0-d3339ad57f90' },
    },
  };

  return withAndroidCleartextTraffic(expoConfig, { enabled: allowDevelopmentCleartext });
};
