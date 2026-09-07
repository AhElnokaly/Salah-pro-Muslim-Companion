/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { PrayerLog, PrayerName } from '../../../types';

export const DAYS_RTL_LABELS = ['ج', 'خ', 'ر', 'ث', 'ن', 'ح', 'س']; // Friday to Saturday RTL

export const DAY_INDEX_MAP: Record<number, number> = {
  5: 0, // Friday
  4: 1, // Thursday
  3: 2, // Wednesday
  2: 3, // Tuesday
  1: 4, // Monday
  0: 5, // Sunday
  6: 6  // Saturday
};

export const ARABIC_MONTH_NAMES = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

export function computeIntensity(ratio: number): 0 | 1 | 2 | 3 | 4 | 5 {
  if (ratio <= 0) return 0;
  if (ratio <= 0.2) return 1; // 1 prayer
  if (ratio <= 0.4) return 2; // 2 prayers
  if (ratio <= 0.6) return 3; // 3 prayers
  if (ratio <= 0.8) return 4; // 4 prayers
  return 5;                    // All 5 prayers
}

export function calculateStreaks(prayerLogs: Record<string, Record<string, PrayerLog>>) {
  const dailyPrayers: PrayerName[] = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // Get all dates present in logs or generated chronologically
  const dates = Object.keys(prayerLogs).sort();
  if (dates.length === 0) {
    return { current: 0, best: 0 };
  }

  let currentStreak = 0;
  let bestStreak = 0;
  let runningStreak = 0;

  // Find start date from earliest log or 30 days ago
  const startDate = new Date(dates[0]);
  const endDate = new Date(today);

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const dayLog = prayerLogs[dStr] || {};

    let performedCount = 0;
    for (const p of dailyPrayers) {
      const status = dayLog[p]?.status;
      if (status === 'A' || status === 'B' || status === 'E') {
        performedCount++;
      }
    }

    if (performedCount === 5) {
      runningStreak++;
      if (runningStreak > bestStreak) {
        bestStreak = runningStreak;
      }
    } else {
      // Streak breaks
      runningStreak = 0;
    }

    if (dStr === todayStr) {
      currentStreak = runningStreak;
    }
  }

  return { current: currentStreak, best: bestStreak };
}

export interface HeatmapCellData {
  dayNumber: number;
  dateStr: string;
  completionRatio: number;
  intensity: 0 | 1 | 2 | 3 | 4 | 5;
  isToday: boolean;
  dateObj: Date;
}

export interface MonthPrayerStats {
  totalPerformed: number;
  prayerBreakdown: Record<Exclude<PrayerName, 'Sunrise'>, number>;
  inTimeCount: number;
  qadaCount: number;
  excusedCount: number;
  missedCount: number;
  daysCount: number;
}
