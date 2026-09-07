/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { AlarmConfig, PrayerName, RelativePrayerTarget } from '../types';
import { getArabicPrayerName } from './prayerCalc';
import { toArabicNumbers } from './hijri';

export const ALL_PRAYER_NAMES: RelativePrayerTarget[] = [
  'Fajr',
  'Sunrise',
  'Dhuhr',
  'Asr',
  'Maghrib',
  'Isha'
];

export const FIVE_PRAYERS_ONLY: PrayerName[] = [
  'Fajr',
  'Dhuhr',
  'Asr',
  'Maghrib',
  'Isha'
];

export const DAYS_ARABIC_ORDERED = [
  { day: 6, short: 'سبت', full: 'السبت' },
  { day: 0, short: 'أحد', full: 'الأحد' },
  { day: 1, short: 'إثنين', full: 'الإثنين' },
  { day: 2, short: 'ثلاثاء', full: 'الثلاثاء' },
  { day: 3, short: 'أربعاء', full: 'الأربعاء' },
  { day: 4, short: 'خميس', full: 'الخميس' },
  { day: 5, short: 'جمعة', full: 'الجمعة' }
];

export const DEFAULT_WORSHIP_ALARMS: AlarmConfig[] = [
  {
    id: 'alarm_before_salah',
    title: 'تنبيه قبل الصلاة',
    enabled: true,
    type: 'prayer_relative',
    prayers: ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'],
    relation: 'before',
    offsetMinutes: 10,
    offsetUnit: 'minutes',
    days: [0, 1, 2, 3, 4, 5, 6],
    soundType: 'takbeer',
    notifyMode: 'both'
  },
  {
    id: 'alarm_after_salah',
    title: 'تنبيه بعد الصلاة (الأذكار والسنن)',
    enabled: true,
    type: 'prayer_relative',
    prayers: ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'],
    relation: 'after',
    offsetMinutes: 15,
    offsetUnit: 'minutes',
    days: [0, 1, 2, 3, 4, 5, 6],
    soundType: 'salawat',
    notifyMode: 'both'
  },
  {
    id: 'alarm_duha',
    title: 'صلاة الضحى (صلاة الأوابين)',
    enabled: true,
    type: 'prayer_relative',
    prayers: ['Sunrise'],
    relation: 'after',
    offsetMinutes: 15,
    offsetUnit: 'minutes',
    days: [0, 1, 2, 3, 4, 5, 6],
    soundType: 'duaa',
    notifyMode: 'both'
  },
  {
    id: 'alarm_qiyam',
    title: 'قيام الليل والتهجد',
    enabled: false,
    type: 'prayer_relative',
    prayers: ['Fajr'],
    relation: 'before',
    offsetMinutes: 45,
    offsetUnit: 'minutes',
    days: [0, 1, 2, 3, 4, 5, 6],
    soundType: 'istighfar',
    notifyMode: 'both'
  }
];

export function getArabicPrayerOrEventName(target: RelativePrayerTarget): string {
  if (target === 'Sunrise') return 'الشروق';
  return getArabicPrayerName(target);
}

/**
 * Formats repeating days cleanly for the alarm card subtitle.
 */
export function formatAlarmDays(days: number[]): string {
  if (!days || days.length === 0) return 'معطل (لا يوجد تكرار)';
  if (days.length === 7) return 'كل يوم';
  
  // Check if weekdays (Sun to Thu in Islamic/Arab world)
  const isArabWorkdays = days.length === 5 && [0, 1, 2, 3, 4].every(d => days.includes(d));
  if (isArabWorkdays) return 'أيام العمل (الأحد - الخميس)';

  // Check if weekend (Fri & Sat)
  const isWeekend = days.length === 2 && days.includes(5) && days.includes(6);
  if (isWeekend) return 'عطلة نهاية الأسبوع (الجمعة والسبت)';

  return DAYS_ARABIC_ORDERED
    .filter(item => days.includes(item.day))
    .map(item => item.short)
    .join('  ');
}

/**
 * Formats alarm timing description (e.g. "10 دقائق قبل الفجر، الظهر، العصر...")
 */
export function formatAlarmTimingDesc(alarm: AlarmConfig): string {
  if (alarm.type === 'fixed' || (!alarm.type && alarm.time)) {
    const timeStr = alarm.time || '00:00';
    const [h, m] = timeStr.split(':').map(Number);
    const period = h >= 12 ? 'م' : 'ص';
    const displayH = h % 12 || 12;
    return `الساعة ${toArabicNumbers(`${displayH}:${m.toString().padStart(2, '0')}`)} ${period}`;
  }

  // Relative to prayer
  const offset = alarm.offsetMinutes ?? 10;
  const unitStr = (alarm.offsetUnit === 'hours' || offset >= 60 && offset % 60 === 0)
    ? (offset === 60 ? 'ساعة واحدة' : `${toArabicNumbers(Math.round(offset / 60))} ساعات`)
    : `${toArabicNumbers(offset)} دقيقة`;

  const relationStr = alarm.relation === 'before'
    ? 'قبل'
    : alarm.relation === 'after'
      ? 'بعد'
      : 'عند موعد';

  const prayersList = (alarm.prayers && alarm.prayers.length > 0)
    ? alarm.prayers
    : FIVE_PRAYERS_ONLY;

  const prayersStr = prayersList.map(getArabicPrayerOrEventName).join('، ');

  if (alarm.relation === 'at' || offset === 0) {
    return `عند موعد ${prayersStr}`;
  }

  return `${unitStr} ${relationStr} ${prayersStr}`;
}

/**
 * Parses "HH:MM" string to minutes from midnight (0..1439).
 */
export function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.split(':');
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return h * 60 + m;
}

/**
 * Converts minutes from midnight to "HH:MM" 24h format.
 */
export function formatMinutesToTime(totalMins: number): string {
  const norm = ((totalMins % 1440) + 1440) % 1440;
  const h = Math.floor(norm / 60).toString().padStart(2, '0');
  const m = (norm % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * Calculates the exact trigger minute (0..1439) for an alarm given a specific prayer's time.
 */
export function calculateTriggerMinutes(
  alarm: AlarmConfig,
  prayerTimeStr?: string
): number | null {
  if (alarm.type === 'fixed' || (!alarm.type && alarm.time)) {
    if (!alarm.time) return null;
    return parseTimeToMinutes(alarm.time);
  }

  if (!prayerTimeStr) return null;
  const baseMins = parseTimeToMinutes(prayerTimeStr);
  const offset = alarm.offsetMinutes || 0;

  let targetMins = baseMins;
  if (alarm.relation === 'before') {
    targetMins = baseMins - offset;
  } else if (alarm.relation === 'after') {
    targetMins = baseMins + offset;
  }

  return ((targetMins % 1440) + 1440) % 1440;
}
