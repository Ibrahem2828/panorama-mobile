import AsyncStorage from '@react-native-async-storage/async-storage';

export const ONBOARDING_SEEN_STORAGE_KEY = 'panorama_onboarding_seen_v1';

export async function hasSeenOnboarding(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(ONBOARDING_SEEN_STORAGE_KEY)) === 'true';
  } catch {
    return true;
  }
}

export async function markOnboardingSeen(): Promise<void> {
  await AsyncStorage.setItem(ONBOARDING_SEEN_STORAGE_KEY, 'true');
}
