import { useEffect } from 'react';
import * as ScreenCapture from 'expo-screen-capture';

import { env } from '../config/env';
import { isScreenCaptureBlocked } from '../utils/screenCapturePolicy';

/**
 * Blocks screenshots, screen recording and the recent-apps thumbnail while the calling component is mounted. The app
 * root uses it so that no screen at all can be captured (chat, groups, files, lectures, sign-in, verification...).
 * Different keys are independent, so a screen that releases its own key never lifts the root protection.
 */
export function useSecureScreen(key: string) {
  useEffect(() => {
    if (!isScreenCaptureBlocked({ appEnv: env.appEnv, allowScreenshots: env.allowScreenshots })) {
      return undefined;
    }

    void ScreenCapture.preventScreenCaptureAsync(key).catch(() => undefined);

    return () => {
      void ScreenCapture.allowScreenCaptureAsync(key).catch(() => undefined);
    };
  }, [key]);
}
