import Constants from 'expo-constants';
import { Platform } from 'react-native';

import type { HttpHeaders } from './http';

type ApplicationModule = {
  nativeApplicationVersion?: string | null;
  nativeBuildVersion?: string | null;
};

const FALLBACK_VERSION = '2.0.0';
const FALLBACK_BUILD = '200';

function readApplicationModule(): ApplicationModule | null {
  try {
    // Loaded lazily so a missing native module (tests, web) cannot break the request layer.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-application') as ApplicationModule;
  } catch {
    return null;
  }
}

function toBuildNumber(value: unknown): string | null {
  const parsed = Number.parseInt(String(value ?? ''), 10);

  return Number.isFinite(parsed) && parsed >= 0 ? String(parsed) : null;
}

export type AppClientInfo = {
  platform: 'android' | 'ios' | null;
  version: string;
  build: string;
};

/**
 * What the backend lifecycle middleware reads (X-App-Platform / X-App-Build) to decide
 * whether this binary still meets the minimum supported release.
 */
export function getAppClientInfo(): AppClientInfo {
  const application = readApplicationModule();
  const config = Constants.expoConfig;
  const version = application?.nativeApplicationVersion || config?.version || FALLBACK_VERSION;
  const build =
    toBuildNumber(application?.nativeBuildVersion) ??
    toBuildNumber(
      Platform.OS === 'ios' ? config?.ios?.buildNumber : config?.android?.versionCode,
    ) ??
    FALLBACK_BUILD;

  return {
    platform: Platform.OS === 'android' || Platform.OS === 'ios' ? Platform.OS : null,
    version,
    build,
  };
}

export function getAppClientHeaders(): HttpHeaders {
  const info = getAppClientInfo();

  // The backend only gates recognised mobile platforms; never send a made-up one.
  if (!info.platform) {
    return {};
  }

  return {
    'X-App-Platform': info.platform,
    'X-App-Version': info.version,
    'X-App-Build': info.build,
  };
}
