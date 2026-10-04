import { AppSettings, PrayerName } from '../types';
import { PushNotificationSettings } from './pushNotificationService';

const PRAYER_CANONICAL_NAMES: Record<string, PrayerName> = {
  fajr: 'Fajr',
  sunrise: 'Sunrise',
  dhuhr: 'Dhuhr',
  asr: 'Asr',
  maghrib: 'Maghrib',
  isha: 'Isha',
};

/**
 * Single source of truth helper to determine whether athan (Adhan) audio/alarm is enabled.
 * Returns false if:
 *  - pushSettings.prayerAthan === false (global athan toggle OFF)
 *  - settings.adhanEnabled[prayer] === false (individual prayer toggle OFF)
 * Returns true if undefined / missing / true.
 */
export function isAthanEnabled(
  prayerCanonicalName: string,
  settings?: Partial<AppSettings> | { adhanEnabled?: Record<string, boolean> | null } | null,
  pushSettings?: Partial<PushNotificationSettings> | { prayerAthan?: boolean } | null
): boolean {
  if (pushSettings?.prayerAthan === false) {
    return false;
  }
  if (!prayerCanonicalName) {
    return true;
  }

  const lower = prayerCanonicalName.toLowerCase();
  const canonical = PRAYER_CANONICAL_NAMES[lower] || (prayerCanonicalName.charAt(0).toUpperCase() + prayerCanonicalName.slice(1).toLowerCase());

  const adhanMap = settings?.adhanEnabled;
  if (adhanMap) {
    if ((adhanMap as Record<string, boolean>)[canonical] === false) {
      return false;
    }
    if ((adhanMap as Record<string, boolean>)[prayerCanonicalName] === false) {
      return false;
    }
  }

  return true;
}

/**
 * Returns an enabled map for all five daily prayers based on current settings and push settings.
 */
export function getAthanEnabledMap(
  settings?: Partial<AppSettings> | { adhanEnabled?: Record<string, boolean> | null } | null,
  pushSettings?: Partial<PushNotificationSettings> | { prayerAthan?: boolean } | null
): Record<string, boolean> {
  const prayers: PrayerName[] = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
  const map: Record<string, boolean> = {};
  for (const p of prayers) {
    map[p] = isAthanEnabled(p, settings, pushSettings);
  }
  return map;
}
