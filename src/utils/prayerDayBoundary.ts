/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { calculatePrayerTimes, parseTimeToMinutes } from './prayerCalc';

/**
 * Formats a Date object to YYYY-MM-DD
 */
export function formatDateKey(date: Date): string {
  if (!date || isNaN(date.getTime())) {
    date = new Date();
  }
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Returns YYYY-MM-DD string representing the standard calendar date.
 * @deprecated Inactive / Deprecated: Reverted to standard calendar midnight (00:00) boundary.
 * Usability testing on real physical devices showed that calculating day boundaries
 * from Fajr-to-Fajr caused user confusion (e.g. logging missed/night prayers after midnight
 * was recorded under the new day instead of the intended day). The entire app now uses 
 * standard calendar midnight dates uniformly across Prayer, Quran, Fasting, and Adhkar.
 */
export function getAppPrayerDay(
  timestamp: Date = new Date(),
  _lat?: number,
  _lng?: number,
  _calcMethod?: string,
  _madhab?: 'standard' | 'hanafi',
  _offsets?: Record<string, number>
): string {
  return formatDateKey(timestamp);
}

/**
 * Gets the Date object for an appPrayerDay string (YYYY-MM-DD)
 */
export function getDateFromPrayerDay(prayerDayStr: string): Date {
  if (!prayerDayStr || typeof prayerDayStr !== 'string' || prayerDayStr.includes('NaN')) {
    return new Date();
  }
  const parts = prayerDayStr.split('-').map(Number);
  if (parts.length !== 3 || parts.some(p => isNaN(p))) {
    return new Date();
  }
  return new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0); // Noon to avoid timezone boundary issues
}

export function subtractDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() - days);
  return result;
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
