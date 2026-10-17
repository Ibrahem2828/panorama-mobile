import AsyncStorage from '@react-native-async-storage/async-storage';

import type { PrintCurrency } from '../types';

export const PRINT_CURRENCY_STORAGE_KEY = 'panorama_print_currency_v1';

export function isPrintCurrency(value: unknown): value is PrintCurrency {
  return value === 'SYP' || value === 'USD';
}

/** The student's last chosen print currency, or null when none was stored (callers fall back to SYP). */
export async function readStoredPrintCurrency(): Promise<PrintCurrency | null> {
  try {
    const stored = await AsyncStorage.getItem(PRINT_CURRENCY_STORAGE_KEY);
    return isPrintCurrency(stored) ? stored : null;
  } catch {
    return null;
  }
}

export async function storePrintCurrency(currency: PrintCurrency): Promise<void> {
  try {
    await AsyncStorage.setItem(PRINT_CURRENCY_STORAGE_KEY, currency);
  } catch {
    // Losing the preference only costs the default next time.
  }
}
