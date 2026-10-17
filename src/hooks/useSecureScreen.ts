import { useEffect } from 'react';
import * as ScreenCapture from 'expo-screen-capture';

import { env } from '../config/env';

/**
 * Blocks screenshots, screen recording and the recent-apps thumbnail while a sensitive screen is
 * mounted (sign-in, registration, student-card upload). Only in production builds, so developers
 * and testers can still capture their own screens.
 */
export function useSecureScreen(key: string) {
  useEffect(() => {
    if (env.appEnv !== 'production') {
      return undefined;
    }

    void ScreenCapture.preventScreenCaptureAsync(key).catch(() => undefined);

    return () => {
      void ScreenCapture.allowScreenCaptureAsync(key).catch(() => undefined);
    };
  }, [key]);
}
