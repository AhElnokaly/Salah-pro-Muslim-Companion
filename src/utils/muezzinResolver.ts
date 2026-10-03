/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { safeGetItem } from './storage';
import { PrayerName } from '../types';

export const DEFAULT_MUEZZIN_FAJR = 'fajr_default';
export const DEFAULT_MUEZZIN_GENERAL = 'prayer_default';

const PRAYER_KEY_MAP: Record<string, string> = {
  'الفجر': 'Fajr',
  'الشروق': 'Sunrise',
  'تنبيه شروق الشمس': 'Sunrise',
  'الظهر': 'Dhuhr',
  'العصر': 'Asr',
  'المغرب': 'Maghrib',
  'العشاء': 'Isha',
};

export interface MuezzinFallbackOptions {
  fajrFallback?: string;
  generalFallback?: string;
}

/**
 * Single Canonical Muezzin Resolver.
 * Resolves the active muezzin ID for a given prayer using the canonical precedence:
 * 1. Per-prayer explicit setting: safeGetItem(`salah_muezzin_${prayerKey}`)
 * 2. Category setting: (Fajr ? safeGetItem('salah_fajr_muezzin') : safeGetItem('salah_general_muezzin'))
 * 3. Default fallback: fajr_default / prayer_default (or custom fallback if provided)
 */
export function resolveMuezzinId(
  prayerKey: PrayerName | string,
  options?: MuezzinFallbackOptions
): string {
  const normalizedKey = PRAYER_KEY_MAP[prayerKey] || prayerKey;
  const perPrayer = safeGetItem(`salah_muezzin_${normalizedKey}`);
  if (perPrayer) {
    return perPrayer;
  }

  const isFajr = normalizedKey === 'Fajr' || normalizedKey === 'الفجر';
  if (isFajr) {
    return safeGetItem('salah_fajr_muezzin') || options?.fajrFallback || DEFAULT_MUEZZIN_FAJR;
  }

  return safeGetItem('salah_general_muezzin') || options?.generalFallback || DEFAULT_MUEZZIN_GENERAL;
}
