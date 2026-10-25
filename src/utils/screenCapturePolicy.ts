/**
 * Screens, recordings and the recent-apps thumbnail are blocked in EVERY screen of the app. The only way out is a
 * non-production build started with EXPO_PUBLIC_ALLOW_SCREENSHOTS=true (testers, emulator work); production can never opt out.
 */
export function isScreenCaptureBlocked(options: {
  appEnv: 'development' | 'preview' | 'production';
  allowScreenshots: boolean;
}): boolean {
  if (options.appEnv === 'production') {
    return true;
  }

  return !options.allowScreenshots;
}
