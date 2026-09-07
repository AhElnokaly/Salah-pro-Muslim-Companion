/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { calculatePrayerTimes, parseTimeToMinutes, getTimezoneOffsetForLocation } from './prayerCalc';
import { ScheduledAthanItem } from '../types/pushSchedule';
import { AppSettings } from '../types';
import { safeSetItem, safeGetItem, safeGetJSON, safeSetJSON } from './storage';

const SCHEDULE_STORAGE_KEY = 'mc_scheduled_athans_v1';
const LAST_SYNC_KEY = 'mc_scheduled_athans_last_sync';

/**
 * Get locally saved scheduled athan items
 */
export function getStoredScheduledAthans(): ScheduledAthanItem[] {
  return safeGetJSON<ScheduledAthanItem[]>(SCHEDULE_STORAGE_KEY, []);
}

/**
 * Save scheduled athan items locally
 */
export function saveScheduledAthans(items: ScheduledAthanItem[]): void {
  safeSetJSON(SCHEDULE_STORAGE_KEY, items);
  safeSetItem(LAST_SYNC_KEY, new Date().toISOString());
}

/**
 * Check if the schedule needs a refresh (if last sync > 7 days ago or missing)
 */
export function isScheduleSyncNeeded(): boolean {
  const lastSync = safeGetItem(LAST_SYNC_KEY);
  if (!lastSync) return true;
  const diffDays = (Date.now() - new Date(lastSync).getTime()) / (1000 * 60 * 60 * 24);
  return diffDays >= 7;
}

/**
 * Generates upcoming N-day (default 30) prayer times in pure UTC ISO format.
 * No location coordinates are sent to the server — only the calculated timestamp schedule.
 */
export function generate30DayPrayerSchedule(
  startDate: Date = new Date(),
  lat: number = 30.0444,
  lng: number = 31.2357,
  calcMethod: string = 'Egypt',
  madhab: 'standard' | 'hanafi' = 'standard',
  manualOffsets: Record<string, number> = {},
  daysCount: number = 30,
  timezoneId?: string
): ScheduledAthanItem[] {
  const result: ScheduledAthanItem[] = [];
  const prayerKeys = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const;

  for (let i = 0; i < daysCount; i++) {
    const d = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + i);
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    const timezoneOffsetHours = getTimezoneOffsetForLocation(d, timezoneId);
    const times = calculatePrayerTimes(d, lat, lng, timezoneOffsetHours, calcMethod, madhab, manualOffsets);

    for (const key of prayerKeys) {
      const timeStr = times[key];
      const minutes = parseTimeToMinutes(timeStr);
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;

      // Construct exact local date time
      const prayerDate = new Date(d.getFullYear(), d.getMonth(), d.getDate(), hours, mins, 0, 0);

      // Only include future times
      if (prayerDate.getTime() > startDate.getTime()) {
        result.push({
          prayerName: key,
          fireAtUtc: prayerDate.toISOString(),
          dateStr
        });
      }
    }
  }

  return result;
}

/**
 * Sync upcoming 30-day prayer schedule into local storage and return payload
 */
export function syncUpcomingPrayerSchedule(settings: AppSettings): ScheduledAthanItem[] {
  const schedule = generate30DayPrayerSchedule(
    new Date(),
    settings.latitude ?? 30.0444,
    settings.longitude ?? 31.2357,
    settings.calcMethod ?? 'Egypt',
    settings.madhab ?? 'standard',
    settings.prayerOffsets ?? {},
    30,
    settings.timezoneId
  );
  saveScheduledAthans(schedule);
  return schedule;
}
