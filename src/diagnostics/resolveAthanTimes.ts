/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AlarmDiagnosticsResult } from '../services/athanAlarmPlugin';
import { AppSettings } from '../types';
import { generatePrayerSchedule } from '../utils/prayerScheduleSync';

export interface ResolvedAthanTime {
  name: string;
  timeMs: number;
}

/**
 * Normalizes prayer names and keys (Arabic or English) into canonical lower-case prayer keys.
 */
export function normalizePrayerKey(nameOrKey?: string): string {
  if (!nameOrKey) return '';
  const clean = nameOrKey.trim().toLowerCase();
  if (clean.includes('فجر') || clean === 'fajr') return 'fajr';
  if (clean.includes('شروق') || clean === 'sunrise') return 'sunrise';
  if (clean.includes('ظهر') || clean === 'dhuhr') return 'dhuhr';
  if (clean.includes('عصر') || clean === 'asr') return 'asr';
  if (clean.includes('مغرب') || clean === 'maghrib') return 'maghrib';
  if (clean.includes('عشاء') || clean === 'isha') return 'isha';
  return clean;
}

/**
 * Resolves upcoming prayer times for diagnostics proximity check:
 * 1. Filters `savedAlarms` for alarmType === 'athan'.
 * 2. Unions with fallback `generatePrayerSchedule` covering today and tomorrow.
 * 3. Deduplicates items by (normalized prayer key + minute bucket).
 * 4. Fails closed (returns empty array `[]`) if both sources have no valid prayer times.
 */
export function resolveAthanTimes(
  diagnostics?: AlarmDiagnosticsResult | null,
  settings?: Partial<AppSettings> | null,
  now: Date = new Date()
): ResolvedAthanTime[] {
  // 1. Read savedAlarms and filter for athan
  const savedAthans = (diagnostics?.savedAlarms || []).filter((a) => a.alarmType === 'athan');

  // 2. Fallback to generatePrayerSchedule (today & tomorrow) using stored settings
  const fallbackAthans = generatePrayerSchedule(settings, now, 2);

  // 3. Union with deduplication by normalized prayer name + minute bucket
  const seen = new Set<string>();
  const athanTimes: ResolvedAthanTime[] = [];

  for (const a of savedAthans) {
    const normKey = normalizePrayerKey(a.prayerKey || a.prayerName);
    const minBucket = Math.round(a.timeMs / 60000);
    const dedupeKey = `${normKey}_${minBucket}`;
    if (!seen.has(dedupeKey)) {
      seen.add(dedupeKey);
      athanTimes.push({
        name: a.prayerName || normKey,
        timeMs: a.timeMs,
      });
    }
  }

  for (const f of fallbackAthans) {
    const normKey = normalizePrayerKey(f.name);
    const minBucket = Math.round(f.timeMs / 60000);
    const dedupeKey = `${normKey}_${minBucket}`;
    if (!seen.has(dedupeKey)) {
      seen.add(dedupeKey);
      athanTimes.push({
        name: f.name,
        timeMs: f.timeMs,
      });
    }
  }

  athanTimes.sort((a, b) => a.timeMs - b.timeMs);

  return athanTimes;
}
