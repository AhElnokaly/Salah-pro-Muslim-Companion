/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PrayerTimes } from '../../types';
import { KhushuSettings } from './khushuTypes';
import { parseTimeToMinutes } from '../../utils/prayerCalc';

export interface IqamaWindowInfo {
  prayerId: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
  prayerName: string;
  athanDate: Date;
  iqamaDate: Date;
  minutesToIqama: number;
  isInAdhanIqamaWindow: boolean;
  isExactIqamaMoment: boolean;
  suggestedDuration: number;
}

const PRAYER_ARABIC_NAMES: Record<string, string> = {
  fajr: 'الفجر',
  dhuhr: 'الظهر',
  asr: 'العصر',
  maghrib: 'المغرب',
  isha: 'العشاء',
};

export function parsePrayerTimeToDate(timeStr: string, baseDate: Date): Date | null {
  if (!timeStr || timeStr === '--:--') return null;
  const totalMins = parseTimeToMinutes(timeStr);
  if (isNaN(totalMins) || totalMins < 0) return null;

  const hours = Math.floor(totalMins / 60);
  const minutes = totalMins % 60;
  return new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), hours, minutes, 0, 0);
}

/**
 * Calculates current status in the Adhan -> Iqama -> Khushu lifecycle
 */
export function getIqamaWindowInfo(
  times: PrayerTimes | null | undefined,
  settings: KhushuSettings,
  now: Date = new Date()
): IqamaWindowInfo | null {
  if (!times) return null;

  const isFriday = now.getDay() === 5;

  const prayerEntries: Array<{ id: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha'; timeStr?: string }> = [
    { id: 'fajr', timeStr: times.Fajr },
    { id: 'dhuhr', timeStr: times.Dhuhr },
    { id: 'asr', timeStr: times.Asr },
    { id: 'maghrib', timeStr: times.Maghrib },
    { id: 'isha', timeStr: times.Isha },
  ];

  for (const item of prayerEntries) {
    if (!item.timeStr) continue;
    const athanDate = parsePrayerTimeToDate(item.timeStr, now);
    if (!athanDate) continue;

    const prayerId = item.id;
    let iqamaOffset = settings.iqamaOffsets[prayerId] || 15;
    let prayerDuration = settings.prayerDurations[prayerId] || 15;

    // Friday Jumu'ah special handling
    if (isFriday && prayerId === 'dhuhr' && settings.enableFridaySpecial) {
      iqamaOffset = settings.iqamaOffsets.friday || 25;
      prayerDuration = settings.prayerDurations.friday || 45;
    }

    const iqamaDate = new Date(athanDate.getTime() + iqamaOffset * 60 * 1000);
    const nowMs = now.getTime();
    const athanMs = athanDate.getTime();
    const iqamaMs = iqamaDate.getTime();

    // Adhan -> Iqama window (between athan and iqama + 90 seconds tolerance)
    if (nowMs >= athanMs && nowMs <= iqamaMs + 90 * 1000) {
      const diffFromIqamaSec = Math.round((nowMs - iqamaMs) / 1000);
      const isExactIqamaMoment = diffFromIqamaSec >= 0 && diffFromIqamaSec <= 90;
      const msLeft = Math.max(0, iqamaMs - nowMs);
      const minutesToIqama = Math.ceil(msLeft / 60000);

      const arabicName = isFriday && prayerId === 'dhuhr' ? 'الجمعة' : PRAYER_ARABIC_NAMES[prayerId];

      return {
        prayerId,
        prayerName: arabicName,
        athanDate,
        iqamaDate,
        minutesToIqama,
        isInAdhanIqamaWindow: true,
        isExactIqamaMoment,
        suggestedDuration: prayerDuration,
      };
    }
  }

  return null;
}
