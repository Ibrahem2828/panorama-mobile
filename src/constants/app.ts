/**
 * Fallback store listings for the forced-update screen, used only when the backend's
 * APP_UPDATE_REQUIRED payload carries no (valid) `store_url`. The iOS entry is a store
 * search because the App Store id is not known to the client.
 */
export const fallbackStoreUrls = {
  android: 'https://play.google.com/store/apps/details?id=com.panorama.student',
  ios: 'https://apps.apple.com/search?term=Panorama',
} as const;

export const appConstants = {
  name: 'Panorama',
  displayNameAr: 'بانوراما',
  phase: 'Phase 1 Project Initialization',
  androidFirst: true,
  rtlFirst: true,
  arabicFirst: true,
} as const;
