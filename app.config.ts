import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Panorama',
  slug: 'panorama-mobile',
  version: '0.1.0',
  orientation: 'portrait',
  scheme: 'panorama',
  userInterfaceStyle: 'light',
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
      backgroundColor: '#001B72',
    },
  },
  extra: {
    ...config.extra,
    appEnv: process.env.EXPO_PUBLIC_APP_ENV ?? 'development',
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8000',
    wsBaseUrl: process.env.EXPO_PUBLIC_WS_BASE_URL ?? 'ws://localhost:8000',
  },
});
